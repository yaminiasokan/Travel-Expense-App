from rest_framework import serializers

from accounts.serializers import UserSerializer

from .models import ActivityLog, Invitation, Notification, Trip, TripMember


class TripMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = TripMember
        fields = ["id", "user", "role", "joined_at"]


class TripSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    member_count = serializers.IntegerField(source="members.count", read_only=True)
    my_role = serializers.SerializerMethodField()

    class Meta:
        model = Trip
        fields = [
            "id", "name", "destination", "description", "cover_image",
            "start_date", "end_date", "budget", "currency", "status",
            "owner", "invite_code", "member_count", "my_role",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "owner", "invite_code", "created_at", "updated_at"]

    def get_my_role(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        membership = obj.members.filter(user=request.user).first()
        return membership.role if membership else None

    def validate(self, attrs):
        start = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end = attrs.get("end_date", getattr(self.instance, "end_date", None))
        if start and end and end < start:
            raise serializers.ValidationError({"end_date": "End date cannot be before start date."})
        return attrs


class TripDetailSerializer(TripSerializer):
    members = TripMemberSerializer(many=True, read_only=True)

    class Meta(TripSerializer.Meta):
        fields = TripSerializer.Meta.fields + ["members"]


class JoinTripSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=12)


class InvitationSerializer(serializers.ModelSerializer):
    invite_link = serializers.SerializerMethodField()

    class Meta:
        model = Invitation
        fields = ["id", "trip", "email", "code", "accepted", "invite_link", "created_at"]
        read_only_fields = ["id", "trip", "code", "accepted", "created_at"]

    def get_invite_link(self, obj):
        return obj.invite_link()


class ActivityLogSerializer(serializers.ModelSerializer):
    actor = UserSerializer(read_only=True)

    class Meta:
        model = ActivityLog
        fields = ["id", "actor", "action", "description", "metadata", "created_at"]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "trip", "type", "message", "is_read", "created_at"]
        read_only_fields = ["id", "trip", "type", "message", "created_at"]


class UpdateMemberRoleSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=TripMember.Role.choices)
