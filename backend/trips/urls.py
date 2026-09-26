from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import JoinTripView, NotificationViewSet, TripViewSet

router = DefaultRouter()
router.register(r"trips", TripViewSet, basename="trip")
router.register(r"notifications", NotificationViewSet, basename="notification")

urlpatterns = [
    path("trips/join/", JoinTripView.as_view(), name="trip-join"),
] + router.urls
