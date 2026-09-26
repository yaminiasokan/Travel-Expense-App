from django.contrib import admin

from .models import ActivityLog, Invitation, Notification, Trip, TripMember


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ["name", "destination", "owner", "status", "budget", "currency", "created_at"]
    list_filter = ["status", "currency"]
    search_fields = ["name", "destination"]


admin.site.register(TripMember)
admin.site.register(Invitation)
admin.site.register(ActivityLog)
admin.site.register(Notification)
