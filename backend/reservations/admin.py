from django.contrib import admin
from .models import Reservation, ReservationHistory


class ReservationHistoryInline(admin.TabularInline):
    model = ReservationHistory
    extra = 0
    readonly_fields = ("changed_at",)


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "event", "participant_count", "status", "reserved_at")
    list_filter = ("status",)
    search_fields = ("user__email", "event__title")
    inlines = [ReservationHistoryInline]
