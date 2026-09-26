import uuid

from django.conf import settings
from django.db import models

from trips.models import Trip


class Category(models.Model):
    name = models.CharField(max_length=50, unique=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Lucide icon name")
    is_default = models.BooleanField(default=True)

    class Meta:
        db_table = "categories"
        verbose_name_plural = "categories"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Expense(models.Model):
    class SplitType(models.TextChoices):
        EQUAL = "equal", "Equal"
        PERCENTAGE = "percentage", "Percentage"
        EXACT = "exact", "Exact Amount"
        SHARE = "share", "Share-Based"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trip = models.ForeignKey(Trip, on_delete=models.CASCADE, related_name="expenses")
    title = models.CharField(max_length=150)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, related_name="expenses"
    )
    paid_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="expenses_paid"
    )
    split_type = models.CharField(max_length=12, choices=SplitType.choices, default=SplitType.EQUAL)
    expense_date = models.DateField()
    notes = models.TextField(blank=True)
    location = models.CharField(max_length=255, blank=True)
    receipt = models.ImageField(upload_to="receipts/", blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="expenses_created"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "expenses"
        ordering = ["-expense_date", "-created_at"]
        indexes = [
            models.Index(fields=["trip", "-expense_date"]),
            models.Index(fields=["paid_by"]),
            models.Index(fields=["category"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.amount} {self.trip.currency})"


class ExpenseSplit(models.Model):
    """How much of an expense a single trip member owes."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    expense = models.ForeignKey(Expense, on_delete=models.CASCADE, related_name="splits")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="expense_splits"
    )
    # The raw input driving the split (percentage points, share count, or
    # exact amount) -- interpretation depends on expense.split_type.
    input_value = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    # The resolved monetary amount this user owes, always populated.
    amount_owed = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = "expense_splits"
        constraints = [
            models.UniqueConstraint(fields=["expense", "user"], name="unique_expense_split_user")
        ]

    def __str__(self):
        return f"{self.user.email} owes {self.amount_owed} for {self.expense.title}"


class Attachment(models.Model):
    """Generic file attachment (receipts, docs) linked to an expense."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    expense = models.ForeignKey(Expense, on_delete=models.CASCADE, related_name="attachments")
    file = models.FileField(upload_to="attachments/")
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "attachments"
