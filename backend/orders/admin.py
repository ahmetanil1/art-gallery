from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Sum
from .models import Order, OrderItem, Payment, ReservationDiscount


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("unit_price", "subtotal_display")
    fields = ("artwork", "quantity", "unit_price", "subtotal_display")

    def subtotal_display(self, obj):
        return format_html("₺{:,.2f}", obj.subtotal)
    subtotal_display.short_description = "Ara Toplam"


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    readonly_fields = ("amount", "method", "status", "transaction_id", "paid_at")
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "id", "user_email", "status_badge", "total_amount_display",
        "discount_display", "payment_method", "created_at",
    )
    list_filter = ("status", "payment_method", "created_at")
    search_fields = ("user__email", "user__first_name")
    list_per_page = 25
    date_hierarchy = "created_at"
    readonly_fields = ("created_at", "updated_at", "paid_at", "total_amount", "discount_amount")
    inlines = [OrderItemInline, PaymentInline]

    fieldsets = (
        ("Sipariş Bilgileri", {
            "fields": ("user", "status", "payment_method"),
        }),
        ("Tutar", {
            "fields": ("total_amount", "discount_amount", "coupon"),
        }),
        ("Teslimat", {
            "fields": ("shipping_address", "notes"),
        }),
        ("Zaman", {
            "fields": ("created_at", "updated_at", "paid_at"),
            "classes": ("collapse",),
        }),
    )

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = "Kullanıcı"

    def status_badge(self, obj):
        colors = {
            "pending": "#f39c12", "paid": "#27ae60", "shipped": "#3498db",
            "delivered": "#2ecc71", "cancelled": "#e74c3c", "refunded": "#95a5a6",
        }
        labels = {
            "pending": "Beklemede", "paid": "Ödendi", "shipped": "Kargoda",
            "delivered": "Teslim", "cancelled": "İptal", "refunded": "İade",
        }
        color = colors.get(obj.status, "#999")
        return format_html(
            '<span style="background:{};color:#fff;padding:3px 10px;border-radius:12px;font-size:11px">{}</span>',
            color, labels.get(obj.status, obj.status)
        )
    status_badge.short_description = "Durum"

    def total_amount_display(self, obj):
        return format_html("₺{:,.2f}", obj.total_amount)
    total_amount_display.short_description = "Toplam"

    def discount_display(self, obj):
        if obj.discount_amount:
            return format_html('<span style="color:#27ae60">-₺{:,.2f}</span>', obj.discount_amount)
        return "-"
    discount_display.short_description = "İndirim"

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("user", "coupon")

    actions = ["mark_shipped", "mark_delivered"]

    def mark_shipped(self, request, queryset):
        queryset.filter(status="paid").update(status="shipped")
        self.message_user(request, "Siparişler kargoya verildi olarak işaretlendi.")
    mark_shipped.short_description = "Kargoya verildi olarak işaretle"

    def mark_delivered(self, request, queryset):
        queryset.filter(status="shipped").update(status="delivered")
        self.message_user(request, "Siparişler teslim edildi olarak işaretlendi.")
    mark_delivered.short_description = "Teslim edildi olarak işaretle"


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "amount_display", "method", "status_badge", "transaction_id", "paid_at")
    list_filter = ("status", "method")
    search_fields = ("transaction_id", "order__user__email")
    readonly_fields = ("created_at", "paid_at", "transaction_id")

    def amount_display(self, obj):
        return format_html("₺{:,.2f}", obj.amount)
    amount_display.short_description = "Tutar"

    def status_badge(self, obj):
        colors = {"pending": "#f39c12", "success": "#27ae60", "failed": "#e74c3c", "refunded": "#95a5a6"}
        labels = {"pending": "Beklemede", "success": "Başarılı", "failed": "Başarısız", "refunded": "İade"}
        color = colors.get(obj.status, "#999")
        return format_html(
            '<span style="background:{};color:#fff;padding:3px 10px;border-radius:12px;font-size:11px">{}</span>',
            color, labels.get(obj.status, obj.status)
        )
    status_badge.short_description = "Durum"


@admin.register(ReservationDiscount)
class ReservationDiscountAdmin(admin.ModelAdmin):
    list_display = ("reservation", "coupon", "is_active", "applied_at")
    list_filter = ("is_active",)
