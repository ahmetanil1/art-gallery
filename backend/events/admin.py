from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Avg
from .models import Event, EventCategory, EventComparison


@admin.register(EventCategory)
class EventCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "event_count")
    search_fields = ("name",)

    def event_count(self, obj):
        return obj.events.count()
    event_count.short_description = "Etkinlik Sayısı"


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = (
        "title", "event_type_badge", "category", "location",
        "start_datetime", "capacity_display", "price_display",
        "status_badge", "status", "avg_rating",
    )
    list_filter = ("status", "event_type", "category")
    search_fields = ("title", "location", "description")
    list_per_page = 20
    date_hierarchy = "start_datetime"
    readonly_fields = ("created_at", "updated_at", "available_slots_display", "occupancy_display")
    list_editable = ("status",)

    fieldsets = (
        ("Temel Bilgiler", {
            "fields": ("title", "description", "event_type", "category", "organizer"),
        }),
        ("Yer & Zaman", {
            "fields": ("location", "start_datetime", "end_datetime"),
        }),
        ("Kapasite & Fiyat", {
            "fields": ("capacity", "price", "status"),
        }),
        ("İstatistikler", {
            "fields": ("available_slots_display", "occupancy_display", "created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    def event_type_badge(self, obj):
        icons = {"workshop": "🎨", "exhibition": "🖼️", "seminar": "📚", "tour": "🗺️", "other": "📌"}
        labels = {"workshop": "Atölye", "exhibition": "Sergi", "seminar": "Seminer", "tour": "Tur", "other": "Diğer"}
        return format_html("{} {}", icons.get(obj.event_type, ""), labels.get(obj.event_type, obj.event_type))
    event_type_badge.short_description = "Tür"

    def capacity_display(self, obj):
        available = obj.available_slots
        pct = obj.occupancy_rate
        color = "#e74c3c" if pct >= 90 else "#f39c12" if pct >= 60 else "#27ae60"
        return format_html(
            '<span style="color:{}">{}/{}</span> <small style="color:#aaa">(%{:.0f})</small>',
            color, obj.capacity - available, obj.capacity, pct
        )
    capacity_display.short_description = "Doluluk"

    def price_display(self, obj):
        return format_html("₺{:,.0f}", obj.price)
    price_display.short_description = "Fiyat"

    def status_badge(self, obj):
        colors = {"upcoming": "#3498db", "ongoing": "#27ae60", "completed": "#95a5a6", "cancelled": "#e74c3c"}
        labels = {"upcoming": "Yaklaşan", "ongoing": "Devam Ediyor", "completed": "Tamamlandı", "cancelled": "İptal"}
        color = colors.get(obj.status, "#999")
        return format_html(
            '<span style="background:{};color:#fff;padding:3px 10px;border-radius:12px;font-size:11px">{}</span>',
            color, labels.get(obj.status, obj.status)
        )
    status_badge.short_description = "Durum"

    def avg_rating(self, obj):
        avg = obj.reviews.filter(is_approved=True).aggregate(a=Avg("rating"))["a"]
        if avg:
            return format_html('<span style="color:#f5a623">★</span> {:.1f}', avg)
        return "-"
    avg_rating.short_description = "Ort. Puan"

    def available_slots_display(self, obj):
        return obj.available_slots
    available_slots_display.short_description = "Mevcut Kontenjan"

    def occupancy_display(self, obj):
        return f"%{obj.occupancy_rate:.1f}"
    occupancy_display.short_description = "Doluluk Oranı"

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("category", "organizer")

    actions = ["cancel_events", "mark_completed"]

    def cancel_events(self, request, queryset):
        queryset.update(status="cancelled")
        self.message_user(request, f"{queryset.count()} etkinlik iptal edildi.")
    cancel_events.short_description = "Seçili etkinlikleri iptal et"

    def mark_completed(self, request, queryset):
        queryset.update(status="completed")
        self.message_user(request, f"{queryset.count()} etkinlik tamamlandı olarak işaretlendi.")
    mark_completed.short_description = "Tamamlandı olarak işaretle"


@admin.register(EventComparison)
class EventComparisonAdmin(admin.ModelAdmin):
    list_display = ("user", "name", "event_count", "saved_at")
    search_fields = ("user__email", "name")

    def event_count(self, obj):
        return obj.events.count()
    event_count.short_description = "Etkinlik Sayısı"
