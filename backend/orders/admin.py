from django.contrib import admin
from .models import Order, OrderItem, Payment, ReservationDiscount


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "status", "total_amount", "payment_method", "created_at")
    list_filter = ("status", "payment_method")
    search_fields = ("user__email",)
    inlines = [OrderItemInline]


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "amount", "method", "status", "paid_at")
    list_filter = ("status", "method")


admin.site.register(ReservationDiscount)
