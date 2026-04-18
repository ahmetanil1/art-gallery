from django.contrib import admin
from django.utils.html import format_html
from .models import ArtworkReview, EventReview, ReviewReply, ReviewVote


class ReviewReplyInline(admin.StackedInline):
    model = ReviewReply
    extra = 0
    ct_field = "review_type"
    fields = ("replied_by", "reply_text", "created_at")
    readonly_fields = ("created_at",)
    max_num = 1


@admin.register(ArtworkReview)
class ArtworkReviewAdmin(admin.ModelAdmin):
    list_display = (
        "user_email", "artwork_title", "rating_stars",
        "is_verified_purchase", "is_approved", "helpful_count", "created_at",
    )
    list_filter = ("is_approved", "is_verified_purchase", "rating")
    search_fields = ("user__email", "artwork__title", "comment")
    list_per_page = 25
    date_hierarchy = "created_at"
    readonly_fields = ("created_at", "updated_at", "helpful_count")
    list_editable = ("is_approved",)

    fieldsets = (
        ("Yorum Bilgileri", {
            "fields": ("user", "artwork", "rating", "comment"),
        }),
        ("Durum", {
            "fields": ("is_verified_purchase", "is_approved", "helpful_count"),
        }),
        ("Zaman", {
            "fields": ("created_at", "updated_at"),
            "classes": ("collapse",),
        }),
    )

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = "Kullanıcı"

    def artwork_title(self, obj):
        return obj.artwork.title
    artwork_title.short_description = "Eser"

    def rating_stars(self, obj):
        stars = "★" * obj.rating + "☆" * (5 - obj.rating)
        return format_html('<span style="color:#f5a623;font-size:14px">{}</span>', stars)
    rating_stars.short_description = "Puan"

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("user", "artwork")

    actions = ["approve_reviews", "reject_reviews"]

    def approve_reviews(self, request, queryset):
        updated = queryset.update(is_approved=True)
        self.message_user(request, f"{updated} yorum onaylandı.")
    approve_reviews.short_description = "Seçili yorumları onayla"

    def reject_reviews(self, request, queryset):
        updated = queryset.update(is_approved=False)
        self.message_user(request, f"{updated} yorum reddedildi.")
    reject_reviews.short_description = "Seçili yorumları reddet"


@admin.register(EventReview)
class EventReviewAdmin(admin.ModelAdmin):
    list_display = (
        "user_email", "event_title", "rating_stars",
        "is_approved", "helpful_count", "created_at",
    )
    list_filter = ("is_approved", "rating")
    search_fields = ("user__email", "event__title", "comment")
    list_per_page = 25
    date_hierarchy = "created_at"
    readonly_fields = ("created_at", "updated_at", "helpful_count")
    list_editable = ("is_approved",)

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = "Kullanıcı"

    def event_title(self, obj):
        return obj.event.title
    event_title.short_description = "Etkinlik"

    def rating_stars(self, obj):
        stars = "★" * obj.rating + "☆" * (5 - obj.rating)
        return format_html('<span style="color:#f5a623;font-size:14px">{}</span>', stars)
    rating_stars.short_description = "Puan"

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("user", "event")

    actions = ["approve_reviews", "reject_reviews"]

    def approve_reviews(self, request, queryset):
        queryset.update(is_approved=True)
        self.message_user(request, "Yorumlar onaylandı.")
    approve_reviews.short_description = "Onayla"

    def reject_reviews(self, request, queryset):
        queryset.update(is_approved=False)
        self.message_user(request, "Yorumlar reddedildi.")
    reject_reviews.short_description = "Reddet"


@admin.register(ReviewReply)
class ReviewReplyAdmin(admin.ModelAdmin):
    list_display = ("replied_by", "review_type", "short_reply", "created_at")
    list_filter = ("review_type",)
    search_fields = ("replied_by__email", "reply_text")
    readonly_fields = ("created_at", "updated_at")

    def short_reply(self, obj):
        return obj.reply_text[:80] + "..." if len(obj.reply_text) > 80 else obj.reply_text
    short_reply.short_description = "Yanıt"


@admin.register(ReviewVote)
class ReviewVoteAdmin(admin.ModelAdmin):
    list_display = ("user", "review_type", "vote", "created_at")
    list_filter = ("vote", "review_type")
    search_fields = ("user__email",)
