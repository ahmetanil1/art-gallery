from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Avg, Count
from .models import Artist, Artwork, ArtworkImage, Category, Favorite, ArtworkComparison


@admin.register(Artist)
class ArtistAdmin(admin.ModelAdmin):
    list_display = ("name", "nationality", "birth_year", "artwork_count")
    search_fields = ("name", "nationality")
    list_filter = ("nationality",)
    list_per_page = 25

    def artwork_count(self, obj):
        return obj.artworks.count()
    artwork_count.short_description = "Eser Sayısı"


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "artwork_count")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name",)

    def artwork_count(self, obj):
        return obj.artworks.count()
    artwork_count.short_description = "Eser Sayısı"


class ArtworkImageInline(admin.TabularInline):
    model = ArtworkImage
    extra = 1
    fields = ("image", "is_primary", "order", "preview")
    readonly_fields = ("preview",)

    def preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="height:60px;border-radius:4px"/>', obj.image.url)
        return "-"
    preview.short_description = "Önizleme"


@admin.register(Artwork)
class ArtworkAdmin(admin.ModelAdmin):
    list_display = (
        "title", "artist", "category", "price_display",
        "status_badge", "status", "view_count", "avg_rating", "created_at",
    )
    list_filter = ("status", "category", "artist")
    search_fields = ("title", "artist__name", "description")
    list_per_page = 20
    date_hierarchy = "created_at"
    inlines = [ArtworkImageInline]
    readonly_fields = ("view_count", "created_at", "updated_at")
    list_editable = ("status",)

    fieldsets = (
        ("Temel Bilgiler", {
            "fields": ("title", "artist", "category", "description"),
        }),
        ("Teknik Detaylar", {
            "fields": ("year_created", "medium", "dimensions"),
        }),
        ("Fiyat & Durum", {
            "fields": ("price", "status"),
        }),
        ("İstatistikler", {
            "fields": ("view_count", "created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    def price_display(self, obj):
        return format_html("₺{:,.0f}", obj.price)
    price_display.short_description = "Fiyat"
    price_display.admin_order_field = "price"

    def status_badge(self, obj):
        colors = {
            "available": "#27ae60", "sold": "#e74c3c",
            "reserved": "#f39c12", "not_for_sale": "#95a5a6",
        }
        labels = {
            "available": "Satışta", "sold": "Satıldı",
            "reserved": "Rezerve", "not_for_sale": "Kapalı",
        }
        color = colors.get(obj.status, "#999")
        return format_html(
            '<span style="background:{};color:#fff;padding:3px 10px;border-radius:12px;font-size:11px">{}</span>',
            color, labels.get(obj.status, obj.status)
        )
    status_badge.short_description = "Durum"

    def avg_rating(self, obj):
        avg = obj.reviews.filter(is_approved=True).aggregate(a=Avg("rating"))["a"]
        if avg:
            stars = "★" * round(avg) + "☆" * (5 - round(avg))
            return format_html('<span style="color:#f5a623">{}</span> ({:.1f})', stars, avg)
        return "-"
    avg_rating.short_description = "Ort. Puan"

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("artist", "category")

    actions = ["mark_available", "mark_not_for_sale"]

    def mark_available(self, request, queryset):
        queryset.update(status="available")
        self.message_user(request, f"{queryset.count()} eser satışa açıldı.")
    mark_available.short_description = "Satışa aç"

    def mark_not_for_sale(self, request, queryset):
        queryset.update(status="not_for_sale")
        self.message_user(request, f"{queryset.count()} eser satışa kapatıldı.")
    mark_not_for_sale.short_description = "Satışa kapat"


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ("user", "artwork", "created_at")
    list_filter = ("created_at",)
    search_fields = ("user__email", "artwork__title")
    date_hierarchy = "created_at"


@admin.register(ArtworkComparison)
class ArtworkComparisonAdmin(admin.ModelAdmin):
    list_display = ("user", "name", "artwork_count", "saved_at")
    search_fields = ("user__email", "name")

    def artwork_count(self, obj):
        return obj.artworks.count()
    artwork_count.short_description = "Eser Sayısı"
