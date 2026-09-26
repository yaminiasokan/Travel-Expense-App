from decimal import Decimal

from rest_framework import serializers

from accounts.serializers import UserSerializer
from trips.models import TripMember

from .models import Attachment, Category, Expense, ExpenseSplit
from .services import ExpenseSplitService, SplitCalculationError


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "icon", "is_default"]


class ExpenseSplitSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = ExpenseSplit
        fields = ["id", "user", "input_value", "amount_owed"]


class SplitParticipantInputSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()
    value = serializers.DecimalField(
        max_digits=12, decimal_places=4, required=False, allow_null=True
    )


class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = ["id", "file", "uploaded_by", "uploaded_at"]
        read_only_fields = ["id", "uploaded_by", "uploaded_at"]


class ExpenseSerializer(serializers.ModelSerializer):
    paid_by = UserSerializer(read_only=True)
    paid_by_id = serializers.UUIDField(write_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        source="category", queryset=Category.objects.all(), write_only=True, required=False
    )
    splits = ExpenseSplitSerializer(many=True, read_only=True)
    split_between = SplitParticipantInputSerializer(many=True, write_only=True)

    class Meta:
        model = Expense
        fields = [
            "id", "trip", "title", "amount", "category", "category_id", "paid_by", "paid_by_id",
            "split_type", "expense_date", "notes", "location", "receipt",
            "splits", "split_between", "created_by", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]

    def validate_trip(self, trip):
        request = self.context["request"]
        if not TripMember.objects.filter(trip=trip, user=request.user).exists():
            raise serializers.ValidationError("You are not a member of this trip.")
        return trip

    def validate_paid_by_id(self, user_id):
        trip = self.initial_data.get("trip")
        if trip and not TripMember.objects.filter(trip_id=trip, user_id=user_id).exists():
            raise serializers.ValidationError("Payer must be a member of the trip.")
        return user_id

    def validate(self, attrs):
        trip = attrs.get("trip") or getattr(self.instance, "trip", None)
        split_between = attrs.get("split_between", [])
        member_ids = set(
            str(uid) for uid in TripMember.objects.filter(trip=trip).values_list("user_id", flat=True)
        )
        for participant in split_between:
            if str(participant["user_id"]) not in member_ids:
                raise serializers.ValidationError(
                    {"split_between": f"User {participant['user_id']} is not a member of this trip."}
                )
        return attrs

    def _build_splits(self, expense, split_type, amount, split_between):
        try:
            resolved = ExpenseSplitService.calculate(
                split_type,
                amount,
                [{"user_id": p["user_id"], "value": p.get("value")} for p in split_between],
            )
        except SplitCalculationError as exc:
            raise serializers.ValidationError({"split_between": exc.detail if hasattr(exc, "detail") else str(exc)})

        input_by_user = {p["user_id"]: p.get("value") for p in split_between}
        ExpenseSplit.objects.filter(expense=expense).delete()
        ExpenseSplit.objects.bulk_create(
            [
                ExpenseSplit(
                    expense=expense,
                    user_id=uid,
                    input_value=input_by_user.get(uid),
                    amount_owed=owed,
                )
                for uid, owed in resolved.items()
            ]
        )

    def create(self, validated_data):
        split_between = validated_data.pop("split_between")
        paid_by_id = validated_data.pop("paid_by_id")
        request = self.context["request"]
        expense = Expense.objects.create(
            paid_by_id=paid_by_id, created_by=request.user, **validated_data
        )
        self._build_splits(expense, expense.split_type, expense.amount, split_between)
        return expense

    def update(self, instance, validated_data):
        split_between = validated_data.pop("split_between", None)
        paid_by_id = validated_data.pop("paid_by_id", None)
        if paid_by_id:
            instance.paid_by_id = paid_by_id
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if split_between is not None:
            self._build_splits(instance, instance.split_type, instance.amount, split_between)
        return instance
