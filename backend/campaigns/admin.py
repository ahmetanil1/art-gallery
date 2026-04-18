from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import Campaign, Coupon


class CouponInline(admin.TabularInline):
    model = Coupon
    extra = 1
    fields = ("code", "discount_rate", "max_uses", "used_count", "valid_from", "valid_until", "is_active")
    readonly_fields = ("used_count",)


@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = (
        "name", "discount_type_display", "discount_rate",
        "target_display", "date_range", "is_active_badge", "is_active", "coupon_count",
    )
    list_filter = ("is_active", "discount_type", "target")
    search_fields = ("name", "description")
    list_per_page = 20
    filter_horizontal = ("artworks", "events")
    inlines = [CouponInline]
    list_editable = ("is_active",)

    fieldsets = (
        ("Kampanya Bilgileri", {
            "fields": ("name", "description", "discount_type", "discount_rate", "discount_amount"),
        }),
        ("Hedef & Süre", {
            "fields": ("target", "start_date", "end_date", "is_active"),
        }),
        ("Kapsam", {
            "fields": ("artworks", "events"),
            "classes": ("collapse",),
        }),
    )

    def discount_type_display(self, obj):
        labels = {"percentage": "% İndirim", "fixed": "Sabit İndirim", "free_slot": "Ücretsiz"}
        return labels.get(obj.discount_type, obj.discount_type)
    discount_type_display.short_description = "İndirim Türü"

    def target_display(self, obj):
        labels = {"all": "Herkese", "specific_users": "Belirli Kullanıcılar", "new_users": "Yeni Kullanıcılar"}
        return labels.get(obj.target, obj.target)
    target_display.short_description = "Hedef"

    def date_range(self, obj):
        now = timezone.now()
        if obj.end_date < now:
            color = "#e74c3c"
            status = "Sona Erdi"
        elif obj.start_date > now:
            color = "#f39c12"
            status = "Başlamadı"
        else:
            color = "#27ae60"
            status = "Aktif"
        return format_html(
            '<span style="color:{}">{}</span><br><small>{} - {}</small>',
            color, status,
            obj.start_date.strftime("%d.%m.%Y"),
            obj.end_date.strftime("%d.%m.%Y"),
        )
    date_range.short_description = "Tarih Aralığı"

    def is_active_badge(self, obj):
        if obj.is_active:
            return format_html('<span style="color:#27ae60;font-weight:bold">✓ Aktif</span>')
        return format_html('<span style="color:#e74c3c">✗ Pasif</span>')
    is_active_badge.short_description = "Durum"

    def coupon_count(self, obj):
        return obj.coupons.count()
    coupon_count.short_description = "Kupon Sayısı"


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = (
        "code", "campaign", "discount_rate", "usage_display",
        "validity_display", "is_active",
    )
    list_filter = ("is_active", "campaign")
    search_fields = ("code", "campaign__name")
    list_per_page = 25
    filter_horizontal = ("assigned_users",)
    list_editable = ("is_active",)

    def usage_display(self, obj):
        pct = (obj.used_count / obj.max_uses * 100) if obj.max_uses else 0
        color = "#e74c3c" if pct >= 90 else "#f39c12" if pct >= 60 else "#27ae60"
        return format_html(
            '<span style="color:{}">{}/{}</span>',
            color, obj.used_count, obj.max_uses
        )
    usage_display.short_description = "Kullanım"

    def validity_display(self, obj):
        now = timezone.now()
        if obj.valid_until < now:
            return format_html('<span style="color:#e74c3c">Süresi Doldu</span>')
        if obj.valid_from > now:
            return format_html('<span style="color:#f39c12">Başlamadı</span>')
        return format_html('<span style="color:#27ae60">Geçerli</span>')
    validity_display.short_description = "Geçerlilik"
