"""Business logic for trips, membership, invitations, and activity feed."""
from django.db import transaction

from .models import ActivityLog, Invitation, Notification, Trip, TripMember


class TripService:
    @staticmethod
    @transaction.atomic
    def create_trip(owner, validated_data) -> Trip:
        trip = Trip.objects.create(owner=owner, **validated_data)
        TripMember.objects.create(trip=trip, user=owner, role=TripMember.Role.OWNER)
        ActivityService.log(trip, owner, "trip_created", f"{owner.get_short_name()} created the trip")
        return trip

    @staticmethod
    @transaction.atomic
    def join_by_code(user, code: str) -> TripMember:
        trip = Trip.objects.select_for_update().get(invite_code=code)
        membership, created = TripMember.objects.get_or_create(
            trip=trip, user=user, defaults={"role": TripMember.Role.MEMBER}
        )
        if created:
            ActivityService.log(
                trip, user, "member_joined", f"{user.get_short_name()} joined the trip"
            )
            NotificationService.notify_trip_members(
                trip,
                Notification.NotificationType.MEMBER_JOINED,
                f"{user.get_short_name()} joined {trip.name}",
                exclude_user=user,
            )
        return membership

    @staticmethod
    @transaction.atomic
    def create_invitation(trip: Trip, invited_by, email: str = "") -> Invitation:
        invitation = Invitation.objects.create(trip=trip, invited_by=invited_by, email=email)
        return invitation

    @staticmethod
    @transaction.atomic
    def remove_member(trip: Trip, target_user) -> None:
        TripMember.objects.filter(trip=trip, user=target_user).delete()
        ActivityService.log(
            trip, target_user, "member_removed", f"{target_user.get_short_name()} left/removed"
        )


class ActivityService:
    @staticmethod
    def log(trip, actor, action, description, metadata=None):
        return ActivityLog.objects.create(
            trip=trip,
            actor=actor,
            action=action,
            description=description,
            metadata=metadata or {},
        )


class NotificationService:
    @staticmethod
    def notify_trip_members(trip, notif_type, message, exclude_user=None):
        member_ids = TripMember.objects.filter(trip=trip).exclude(
            user=exclude_user
        ).values_list("user_id", flat=True)
        Notification.objects.bulk_create(
            [
                Notification(recipient_id=uid, trip=trip, type=notif_type, message=message)
                for uid in member_ids
            ]
        )

    @staticmethod
    def notify_user(user, notif_type, message, trip=None):
        return Notification.objects.create(
            recipient=user, trip=trip, type=notif_type, message=message
        )
