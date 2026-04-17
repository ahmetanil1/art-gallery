from django.contrib import admin
from .models import Campaign, Coupon


class CouponInline(admin.TabularInline):
    model = Coupon
    extra = 1


@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = ("name", "discount_type", "target", "start_date", "end_date", "is_active")
    list_filter = ("is_active", "discount_type", "target")
    search_fields = ("name",)
    inlines = [CouponInline]


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ("code", "campaign", "discount_rate", "used_count", "max_uses", "is_active")
    search_fields = ("code",)
