from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ActivityLog, Invitation, Notification, Trip, TripMember
from .permissions import get_membership
from .serializers import (
    ActivityLogSerializer,
    InvitationSerializer,
    JoinTripSerializer,
    NotificationSerializer,
    TripDetailSerializer,
    TripMemberSerializer,
    TripSerializer,
    UpdateMemberRoleSerializer,
)
from .services import ActivityService, NotificationService, TripService


class TripViewSet(viewsets.ModelViewSet):
    """
    /api/v1/trips/                 GET (list mine), POST (create)
    /api/v1/trips/{id}/            GET, PUT/PATCH, DELETE
    /api/v1/trips/{id}/members/    GET
    /api/v1/trips/{id}/invite/     POST
    /api/v1/trips/{id}/join/       POST  (also exposed at /trips/join/)
    /api/v1/trips/{id}/archive/    POST
    /api/v1/trips/{id}/activity/   GET
    """

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "currency"]
    search_fields = ["name", "destination", "description"]
    ordering_fields = ["created_at", "start_date", "budget", "name"]

    def get_queryset(self):
        return (
            Trip.objects.filter(members__user=self.request.user)
            .select_related("owner")
            .distinct()
        )

    def get_serializer_class(self):
        if self.action == "retrieve":
            return TripDetailSerializer
        return TripSerializer

    def perform_create(self, serializer):
        serializer.instance = TripService.create_trip(self.request.user, serializer.validated_data)

    def perform_update(self, serializer):
        membership = get_membership(self.request.user, self.get_object())
        if not membership or not membership.can_manage_budget():
            self.permission_denied(self.request, message="Only owners/admins can edit this trip.")
        serializer.save()

    def perform_destroy(self, instance):
        membership = get_membership(self.request.user, instance)
        if not membership or membership.role != TripMember.Role.OWNER:
            self.permission_denied(self.request, message="Only the owner can delete this trip.")
        instance.delete()

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        trip = self.get_object()
        trip.status = Trip.Status.ARCHIVED
        trip.save(update_fields=["status"])
        return Response(TripSerializer(trip, context={"request": request}).data)

    @action(detail=True, methods=["get"])
    def members(self, request, pk=None):
        trip = self.get_object()
        members = trip.members.select_related("user", "user__profile")
        return Response(TripMemberSerializer(members, many=True).data)

    @action(detail=True, methods=["post"], url_path="members/(?P<member_id>[^/.]+)/role")
    def update_member_role(self, request, pk=None, member_id=None):
        trip = self.get_object()
        acting_membership = get_membership(request.user, trip)
        if not acting_membership or not acting_membership.can_manage_members():
            return Response(
                {"success": False, "message": "Only owners/admins can change roles."},
                status=status.HTTP_403_FORBIDDEN,
            )
        member = get_object_or_404(TripMember, id=member_id, trip=trip)
        serializer = UpdateMemberRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        member.role = serializer.validated_data["role"]
        member.save(update_fields=["role"])
        return Response(TripMemberSerializer(member).data)

    @action(detail=True, methods=["delete"], url_path="members/(?P<member_id>[^/.]+)")
    def remove_member(self, request, pk=None, member_id=None):
        trip = self.get_object()
        acting_membership = get_membership(request.user, trip)
        member = get_object_or_404(TripMember, id=member_id, trip=trip)
        is_self_leave = member.user_id == request.user.id
        if not is_self_leave and (not acting_membership or not acting_membership.can_manage_members()):
            return Response(
                {"success": False, "message": "Only owners/admins can remove members."},
                status=status.HTTP_403_FORBIDDEN,
            )
        TripService.remove_member(trip, member.user)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"])
    def invite(self, request, pk=None):
        trip = self.get_object()
        membership = get_membership(request.user, trip)
        if not membership or not membership.can_manage_members():
            return Response(
                {"success": False, "message": "Only owners/admins can invite members."},
                status=status.HTTP_403_FORBIDDEN,
            )
        invitation = TripService.create_invitation(
            trip, request.user, email=request.data.get("email", "")
        )
        return Response(InvitationSerializer(invitation).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"])
    def activity(self, request, pk=None):
        trip = self.get_object()
        logs = ActivityLog.objects.filter(trip=trip).select_related("actor")[:100]
        return Response(ActivityLogSerializer(logs, many=True).data)


class JoinTripView(APIView):
    """POST /api/v1/trips/join/  {code: "ABC123"}"""

    def post(self, request):
        serializer = JoinTripSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            trip = Trip.objects.get(invite_code=serializer.validated_data["code"])
        except Trip.DoesNotExist:
            return Response(
                {"success": False, "message": "Invalid invite code."},
                status=status.HTTP_404_NOT_FOUND,
            )
        TripService.join_by_code(request.user, trip.invite_code)
        return Response(TripDetailSerializer(trip, context={"request": request}).data)


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /api/v1/notifications/  and POST /api/v1/notifications/{id}/read/"""

    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    @action(detail=True, methods=["post"])
    def read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=["is_read"])
        return Response(NotificationSerializer(notification).data)

    @action(detail=False, methods=["post"], url_path="read-all")
    def read_all(self, request):
        self.get_queryset().update(is_read=True)
        return Response({"success": True})
