import django_filters

from .models import Expense


class ExpenseFilter(django_filters.FilterSet):
    date_from = django_filters.DateFilter(field_name="expense_date", lookup_expr="gte")
    date_to = django_filters.DateFilter(field_name="expense_date", lookup_expr="lte")
    amount_min = django_filters.NumberFilter(field_name="amount", lookup_expr="gte")
    amount_max = django_filters.NumberFilter(field_name="amount", lookup_expr="lte")
    member = django_filters.UUIDFilter(field_name="splits__user_id")
    paid_by = django_filters.UUIDFilter(field_name="paid_by_id")

    class Meta:
        model = Expense
        fields = ["trip", "category", "split_type", "date_from", "date_to", "amount_min", "amount_max", "member", "paid_by"]
