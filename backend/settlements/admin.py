from django.contrib import admin

from .models import Payment, Settlement


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0


@admin.register(Settlement)
class SettlementAdmin(admin.ModelAdmin):
    list_display = ["trip", "from_user", "to_user", "amount", "amount_paid", "status"]
    list_filter = ["status"]
    inlines = [PaymentInline]
