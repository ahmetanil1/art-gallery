from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import SupportMessage, SupportTicket


class SupportMessageInline(admin.StackedInline):
    model = SupportMessage
    extra = 1
    fields = ("sender", "message", "is_staff_reply", "created_at")
    readonly_fields = ("created_at",)


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = (
        "id", "user_email", "subject_short", "category_display",
        "status_badge", "status", "message_count", "created_at",
    )
    list_filter = ("status", "category", "created_at")
    search_fields = ("user__email", "subject")
    list_per_page = 25
    date_hierarchy = "created_at"
    readonly_fields = ("created_at", "updated_at", "resolved_at")
    inlines = [SupportMessageInline]
    list_editable = ("status",)

    fieldsets = (
        ("Talep Bilgileri", {
            "fields": ("user", "subject", "category", "status"),
        }),
        ("Zaman", {
            "fields": ("created_at", "updated_at", "resolved_at"),
            "classes": ("collapse",),
        }),
    )

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = "Kullanıcı"

    def subject_short(self, obj):
        return obj.subject[:60] + "..." if len(obj.subject) > 60 else obj.subject
    subject_short.short_description = "Konu"

    def category_display(self, obj):
        labels = {
            "order": "📦 Sipariş", "reservation": "📋 Rezervasyon",
            "payment": "💳 Ödeme", "artwork": "🖼️ Eser",
            "account": "👤 Hesap", "other": "📌 Diğer",
        }
        return labels.get(obj.category, obj.category)
    category_display.short_description = "Kategori"

    def status_badge(self, obj):
        colors = {
            "open": "#e74c3c", "in_progress": "#f39c12",
            "resolved": "#27ae60", "closed": "#95a5a6",
        }
        labels = {
            "open": "Açık", "in_progress": "İşlemde",
            "resolved": "Çözüldü", "closed": "Kapatıldı",
        }
        color = colors.get(obj.status, "#999")
        return format_html(
            '<span style="background:{};color:#fff;padding:3px 10px;border-radius:12px;font-size:11px">{}</span>',
            color, labels.get(obj.status, obj.status)
        )
    status_badge.short_description = "Durum"

    def message_count(self, obj):
        count = obj.messages.count()
        return format_html('<span style="font-weight:bold">{}</span> mesaj', count)
    message_count.short_description = "Mesajlar"

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("user").prefetch_related("messages")

    actions = ["resolve_tickets", "close_tickets"]

    def resolve_tickets(self, request, queryset):
        queryset.exclude(status="closed").update(
            status="resolved", resolved_at=timezone.now()
        )
        self.message_user(request, "Seçili talepler çözüldü olarak işaretlendi.")
    resolve_tickets.short_description = "Çözüldü olarak işaretle"

    def close_tickets(self, request, queryset):
        queryset.update(status="closed")
        self.message_user(request, "Seçili talepler kapatıldı.")
    close_tickets.short_description = "Kapat"
