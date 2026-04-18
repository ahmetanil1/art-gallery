from django.contrib import admin
from django.utils.html import format_html
from .models import Reservation, ReservationHistory


class ReservationHistoryInline(admin.TabularInline):
    model = ReservationHistory
    extra = 0
    readonly_fields = ("changed_by", "old_status", "new_status",
                       "old_participant_count", "new_participant_count", "changed_at", "note")
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = (
        "id", "user_email", "event_title", "participant_count",
        "status_badge", "total_price_display", "reserved_at",
    )
    list_filter = ("status", "event__event_type", "reserved_at")
    search_fields = ("user__email", "user__first_name", "event__title")
    list_per_page = 25
    date_hierarchy = "reserved_at"
    readonly_fields = ("reserved_at", "updated_at", "cancelled_at", "total_price_display")
    inlines = [ReservationHistoryInline]

    fieldsets = (
        ("Rezervasyon Bilgileri", {
            "fields": ("user", "event", "participant_count", "notes"),
        }),
        ("Durum", {
            "fields": ("status", "cancelled_at", "cancellation_reason"),
        }),
        ("Zaman Bilgileri", {
            "fields": ("reserved_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = "Kullanıcı"
    user_email.admin_order_field = "user__email"

    def event_title(self, obj):
        return obj.event.title
    event_title.short_description = "Etkinlik"

    def status_badge(self, obj):
        colors = {
            "pending": "#f39c12", "confirmed": "#27ae60",
            "cancelled": "#e74c3c", "completed": "#3498db", "no_show": "#95a5a6",
        }
        labels = {
            "pending": "Beklemede", "confirmed": "Onaylandı",
            "cancelled": "İptal", "completed": "Tamamlandı", "no_show": "Gelmedi",
        }
        color = colors.get(obj.status, "#999")
        return format_html(
            '<span style="background:{};color:#fff;padding:3px 10px;border-radius:12px;font-size:11px">{}</span>',
            color, labels.get(obj.status, obj.status)
        )
    status_badge.short_description = "Durum"

    def total_price_display(self, obj):
        return format_html("₺{:,.2f}", obj.total_price)
    total_price_display.short_description = "Toplam Tutar"

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("user", "event")

    actions = ["confirm_reservations", "cancel_reservations"]

    def confirm_reservations(self, request, queryset):
        updated = queryset.filter(status="pending").update(status="confirmed")
        self.message_user(request, f"{updated} rezervasyon onaylandı.")
    confirm_reservations.short_description = "Seçili rezervasyonları onayla"

    def cancel_reservations(self, request, queryset):
        from django.utils import timezone
        for r in queryset.exclude(status__in=["cancelled", "completed"]):
            r.status = "cancelled"
            r.cancelled_at = timezone.now()
            r.save()
        self.message_user(request, "Rezervasyonlar iptal edildi.")
    cancel_reservations.short_description = "Seçili rezervasyonları iptal et"


@admin.register(ReservationHistory)
class ReservationHistoryAdmin(admin.ModelAdmin):
    list_display = ("reservation", "changed_by", "old_status", "new_status", "changed_at")
    list_filter = ("new_status",)
    readonly_fields = ("changed_at",)
    search_fields = ("reservation__user__email",)
