from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import GenerateSettlementsView, SettlementViewSet, TripBalancesView

router = DefaultRouter()
router.register(r"settlements", SettlementViewSet, basename="settlement")

urlpatterns = [
    path("trips/<uuid:trip_id>/balances/", TripBalancesView.as_view(), name="trip-balances"),
    path("trips/<uuid:trip_id>/settlements/generate/", GenerateSettlementsView.as_view(), name="trip-settlements-generate"),
] + router.urls
