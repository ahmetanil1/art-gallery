from django.contrib import admin
from .models import ArtworkReview, EventReview, ReviewReply, ReviewVote


@admin.register(ArtworkReview)
class ArtworkReviewAdmin(admin.ModelAdmin):
    list_display = ("user", "artwork", "rating", "is_verified_purchase", "is_approved", "created_at")
    list_filter = ("is_approved", "rating")
    search_fields = ("user__email", "artwork__title")
    actions = ["approve_reviews"]

    def approve_reviews(self, request, queryset):
        queryset.update(is_approved=True)
    approve_reviews.short_description = "Seçili yorumları onayla"


@admin.register(EventReview)
class EventReviewAdmin(admin.ModelAdmin):
    list_display = ("user", "event", "rating", "is_approved", "created_at")
    list_filter = ("is_approved", "rating")
    search_fields = ("user__email", "event__title")


admin.site.register(ReviewReply)
admin.site.register(ReviewVote)
