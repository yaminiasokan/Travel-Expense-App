from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, status, viewsets
from rest_framework.response import Response

from trips.models import Notification, TripMember
from trips.permissions import get_membership
from trips.services import ActivityService, NotificationService

from .filters import ExpenseFilter
from .models import Attachment, Category, Expense
from .serializers import AttachmentSerializer, CategorySerializer, ExpenseSerializer


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /api/v1/categories/"""

    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None


class ExpenseViewSet(viewsets.ModelViewSet):
    """
    /api/v1/expenses/?trip=<id>          GET (list), POST (create)
    /api/v1/expenses/{id}/                GET, PUT/PATCH, DELETE
    Filters: category, split_type, date_from, date_to, amount_min, amount_max, member, paid_by
    Search: title, notes, location
    Ordering: expense_date, amount, created_at
    """

    serializer_class = ExpenseSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ExpenseFilter
    search_fields = ["title", "notes", "location"]
    ordering_fields = ["expense_date", "amount", "created_at"]

    def get_queryset(self):
        return (
            Expense.objects.filter(trip__members__user=self.request.user)
            .select_related("trip", "category", "paid_by", "created_by")
            .prefetch_related("splits__user")
            .distinct()
        )

    def perform_create(self, serializer):
        expense = serializer.save()
        ActivityService.log(
            expense.trip,
            self.request.user,
            "expense_added",
            f"{self.request.user.get_short_name()} added '{expense.title}' ({expense.amount} {expense.trip.currency})",
        )
        NotificationService.notify_trip_members(
            expense.trip,
            Notification.NotificationType.EXPENSE_ADDED,
            f"New expense '{expense.title}' added to {expense.trip.name}",
            exclude_user=self.request.user,
        )

    def perform_update(self, serializer):
        expense = self.get_object()
        membership = get_membership(self.request.user, expense.trip)
        if not membership or not membership.can_edit_expense(expense):
            self.permission_denied(self.request, message="You cannot edit this expense.")
        expense = serializer.save()
        ActivityService.log(
            expense.trip, self.request.user, "expense_updated", f"'{expense.title}' was updated"
        )
        NotificationService.notify_trip_members(
            expense.trip,
            Notification.NotificationType.EXPENSE_UPDATED,
            f"Expense '{expense.title}' was updated in {expense.trip.name}",
            exclude_user=self.request.user,
        )

    def perform_destroy(self, instance):
        membership = get_membership(self.request.user, instance.trip)
        if not membership or not membership.can_delete_expense(instance):
            self.permission_denied(self.request, message="You cannot delete this expense.")
        trip = instance.trip
        title = instance.title
        instance.delete()
        ActivityService.log(
            trip, self.request.user, "expense_deleted", f"'{title}' was deleted"
        )
        NotificationService.notify_trip_members(
            trip,
            Notification.NotificationType.EXPENSE_DELETED,
            f"Expense '{title}' was deleted from {trip.name}",
            exclude_user=self.request.user,
        )


class AttachmentViewSet(viewsets.ModelViewSet):
    """/api/v1/attachments/?expense=<id>"""

    serializer_class = AttachmentSerializer
    filterset_fields = ["expense"]

    def get_queryset(self):
        return Attachment.objects.filter(expense__trip__members__user=self.request.user).distinct()

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
