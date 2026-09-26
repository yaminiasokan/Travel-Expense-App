from rest_framework import permissions

from .models import TripMember


def get_membership(user, trip):
    if not user or not user.is_authenticated:
        return None
    return TripMember.objects.filter(trip=trip, user=user).first()


class IsTripMember(permissions.BasePermission):
    """Object-level permission: request.user must belong to the trip."""

    message = "You are not a member of this trip."

    def has_object_permission(self, request, view, obj):
        trip = obj if obj.__class__.__name__ == "Trip" else getattr(obj, "trip", None)
        return get_membership(request.user, trip) is not None


class IsTripAdminOrOwner(permissions.BasePermission):
    """Object-level permission: request.user must be an owner/admin of the trip."""

    message = "Only trip owners or admins can perform this action."

    def has_object_permission(self, request, view, obj):
        trip = obj if obj.__class__.__name__ == "Trip" else getattr(obj, "trip", None)
        membership = get_membership(request.user, trip)
        return bool(membership and membership.can_manage_members())
