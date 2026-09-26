import secrets
import uuid

from django.conf import settings
from django.db import models


def generate_invite_code():
    return secrets.token_urlsafe(6)[:8].upper()


class Trip(models.Model):
    class Status(models.TextChoices):
        PLANNING = "planning", "Planning"
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Completed"
        ARCHIVED = "archived", "Archived"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    destination = models.CharField(max_length=150, blank=True)
    description = models.TextField(blank=True)
    cover_image = models.ImageField(upload_to="trip_covers/", blank=True, null=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    budget = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default="INR")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PLANNING)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="owned_trips"
    )
    invite_code = models.CharField(max_length=12, unique=True, default=generate_invite_code)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "trips"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["owner", "status"]),
            models.Index(fields=["invite_code"]),
        ]

    def __str__(self):
        return self.name


class TripMember(models.Model):
    class Role(models.TextChoices):
        OWNER = "owner", "Owner"
        ADMIN = "admin", "Admin"
        MEMBER = "member", "Member"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="members")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="trip_memberships"
    )
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.MEMBER)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "trip_members"
        constraints = [
            models.UniqueConstraint(fields=["trip", "user"], name="unique_trip_member")
        ]
        indexes = [models.Index(fields=["trip", "user"])]

    def __str__(self):
        return f"{self.user.email} in {self.trip.name} ({self.role})"

    # Permission helpers -----------------------------------------------
    def can_manage_members(self):
        return self.role in (self.Role.OWNER, self.Role.ADMIN)

    def can_manage_budget(self):
        return self.role in (self.Role.OWNER, self.Role.ADMIN)

    def can_edit_expense(self, expense):
        return self.role in (self.Role.OWNER, self.Role.ADMIN) or expense.paid_by_id == self.user_id

    def can_delete_expense(self, expense):
        return self.role in (self.Role.OWNER, self.Role.ADMIN) or expense.paid_by_id == self.user_id


class Invitation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="invitations")
    email = models.EmailField(blank=True)
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_invitations"
    )
    code = models.CharField(max_length=12, default=generate_invite_code)
    accepted = models.BooleanField(default=False)
    accepted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="accepted_invitations",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "invitations"

    def invite_link(self):
        from django.conf import settings as dj_settings

        return f"{dj_settings.FRONTEND_BASE_URL}/trips/join?code={self.code}"


class ActivityLog(models.Model):
    """Audit trail of notable actions taken within a trip."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="activity_logs")
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="activities"
    )
    action = models.CharField(max_length=50)
    description = models.CharField(max_length=255)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "activity_logs"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["trip", "-created_at"])]


class Notification(models.Model):
    class NotificationType(models.TextChoices):
        EXPENSE_ADDED = "expense_added", "Expense Added"
        EXPENSE_UPDATED = "expense_updated", "Expense Updated"
        EXPENSE_DELETED = "expense_deleted", "Expense Deleted"
        MEMBER_JOINED = "member_joined", "Member Joined"
        SETTLEMENT_GENERATED = "settlement_generated", "Settlement Generated"
        PAYMENT_RECEIVED = "payment_received", "Payment Received"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="notifications", null=True)
    type = models.CharField(max_length=30, choices=NotificationType.choices)
    message = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["recipient", "is_read"])]
