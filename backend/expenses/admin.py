from django.contrib import admin

from .models import Attachment, Category, Expense, ExpenseSplit


class ExpenseSplitInline(admin.TabularInline):
    model = ExpenseSplit
    extra = 0


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ["title", "trip", "amount", "category", "paid_by", "split_type", "expense_date"]
    list_filter = ["category", "split_type"]
    search_fields = ["title", "notes"]
    inlines = [ExpenseSplitInline]


admin.site.register(Category)
admin.site.register(Attachment)
