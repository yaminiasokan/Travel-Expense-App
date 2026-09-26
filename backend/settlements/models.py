import uuid

from django.conf import settings
from django.db import models

from trips.models import Trip


class Settlement(models.Model):
    """
    A single required transaction produced by the debt-simplification engine:
    `from_user` should pay `to_user` `amount` to settle the trip's balances.
    """

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PARTIAL = "partial", "Partially Paid"
        PAID = "paid", "Paid"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="settlements")
    from_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="settlements_owed"
    )
    to_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="settlements_receivable"
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    generated_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "settlements"
        indexes = [
            models.Index(fields=["trip", "status"]),
            models.Index(fields=["from_user"]),
            models.Index(fields=["to_user"]),
        ]

    def __str__(self):
        return f"{self.from_user.email} -> {self.to_user.email}: {self.amount}"

    @property
    def remaining_amount(self):
        return self.amount - self.amount_paid


class Payment(models.Model):
    """An actual payment recorded against a Settlement (supports partial pay)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    settlement = models.ForeignKey(Settlement, on_delete=models.CASCADE, related_name="payments")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    note = models.CharField(max_length=255, blank=True)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    paid_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "payments"
        ordering = ["-paid_at"]
