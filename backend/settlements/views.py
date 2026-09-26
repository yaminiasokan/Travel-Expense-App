from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from trips.models import Trip
from trips.permissions import get_membership

from .models import Settlement
from .serializers import BalanceSerializer, RecordPaymentSerializer, SettlementSerializer
from .services import SettlementService, compute_balances

User = get_user_model()


class SettlementViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET  /api/v1/settlements/?trip=<id>          list settlements for a trip
    GET  /api/v1/settlements/{id}/
    POST /api/v1/settlements/{id}/pay/           record a (partial) payment
    """

    serializer_class = SettlementSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["trip", "status", "from_user", "to_user"]

    def get_queryset(self):
        return (
            Settlement.objects.filter(trip__members__user=self.request.user)
            .select_related("trip", "from_user", "to_user")
            .prefetch_related("payments")
            .distinct()
        )

    @action(detail=True, methods=["post"])
    def pay(self, request, pk=None):
        settlement = self.get_object()
        membership = get_membership(request.user, settlement.trip)
        is_participant = request.user.id in (settlement.from_user_id, settlement.to_user_id)
        if not membership or not is_participant:
            return Response(
                {"success": False, "message": "Only the two parties to this settlement can record payment."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = RecordPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            SettlementService.record_payment(
                settlement,
                serializer.validated_data["amount"],
                recorded_by=request.user,
                note=serializer.validated_data.get("note", ""),
            )
        except ValueError as exc:
            return Response({"success": False, "message": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        settlement.refresh_from_db()
        return Response(SettlementSerializer(settlement).data)


class TripSettlementActionsView(APIView):
    """
    GET  /api/v1/trips/{trip_id}/balances/     net balance per member
    POST /api/v1/trips/{trip_id}/settlements/generate/   recompute settlements
    """

    def get_trip(self, trip_id, request):
        trip = get_object_or_404(Trip, id=trip_id)
        if not get_membership(request.user, trip):
            self.permission_denied(request, message="You are not a member of this trip.")
        return trip


class TripBalancesView(TripSettlementActionsView):
    def get(self, request, trip_id):
        trip = self.get_trip(trip_id, request)
        balances = compute_balances(trip)
        users = {str(u.id): u for u in User.objects.filter(id__in=balances.keys())}
        payload = [
            {"user": users[uid], "net_balance": bal}
            for uid, bal in balances.items()
            if uid in users
        ]
        return Response(BalanceSerializer(payload, many=True).data)


class GenerateSettlementsView(TripSettlementActionsView):
    def post(self, request, trip_id):
        trip = self.get_trip(trip_id, request)
        settlements = SettlementService.generate_settlements(trip)
        all_settlements = Settlement.objects.filter(trip=trip).select_related("from_user", "to_user")
        return Response(
            {
                "success": True,
                "message": f"Generated {len(settlements)} settlement transaction(s).",
                "settlements": SettlementSerializer(all_settlements, many=True).data,
            },
            status=status.HTTP_200_OK,
        )
