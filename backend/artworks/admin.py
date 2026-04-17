from django.contrib import admin
from .models import Artist, Artwork, ArtworkImage, Category, Favorite, ArtworkComparison


class ArtworkImageInline(admin.TabularInline):
    model = ArtworkImage
    extra = 1


@admin.register(Artwork)
class ArtworkAdmin(admin.ModelAdmin):
    list_display = ("title", "artist", "category", "price", "status", "view_count")
    list_filter = ("status", "category")
    search_fields = ("title", "artist__name")
    inlines = [ArtworkImageInline]


@admin.register(Artist)
class ArtistAdmin(admin.ModelAdmin):
    list_display = ("name", "nationality", "birth_year")
    search_fields = ("name",)


admin.site.register(Category)
admin.site.register(Favorite)
admin.site.register(ArtworkComparison)
