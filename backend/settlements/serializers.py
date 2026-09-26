from decimal import Decimal

from rest_framework import serializers

from accounts.serializers import UserSerializer

from .models import Payment, Settlement


class PaymentSerializer(serializers.ModelSerializer):
    recorded_by = UserSerializer(read_only=True)

    class Meta:
        model = Payment
        fields = ["id", "settlement", "amount", "note", "recorded_by", "paid_at"]
        read_only_fields = ["id", "settlement", "recorded_by", "paid_at"]


class SettlementSerializer(serializers.ModelSerializer):
    from_user = UserSerializer(read_only=True)
    to_user = UserSerializer(read_only=True)
    remaining_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Settlement
        fields = [
            "id", "trip", "from_user", "to_user", "amount", "amount_paid",
            "remaining_amount", "status", "payments", "generated_at", "updated_at",
        ]
        read_only_fields = fields


class RecordPaymentSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal("0.01"))
    note = serializers.CharField(required=False, allow_blank=True, default="")


class BalanceSerializer(serializers.Serializer):
    user = UserSerializer()
    net_balance = serializers.DecimalField(max_digits=12, decimal_places=2)
