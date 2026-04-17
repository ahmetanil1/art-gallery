from django.conf import settings
from django.contrib.postgres.indexes import BrinIndex
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class ArtworkReview(models.Model):
    """Eser yorumu (Gereksinim 12, 13, 14, 15, 19)"""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="artwork_reviews",
    )
    artwork = models.ForeignKey(
        "artworks.Artwork",
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField()
    is_verified_purchase = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=True)
    helpful_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "artwork_reviews"
        unique_together = ("user", "artwork")
        verbose_name = "Eser Yorumu"
        verbose_name_plural = "Eser Yorumları"
        indexes = [
            models.Index(fields=["artwork", "is_approved"], name="artwork_reviews_artwork_idx"),
            models.Index(fields=["rating"], name="artwork_reviews_rating_idx"),
            BrinIndex(fields=["created_at"], name="artwork_reviews_created_brin"),
        ]

    def __str__(self):
        return f"{self.user.email} → {self.artwork.title} ({self.rating}★)"


class EventReview(models.Model):
    """Etkinlik yorumu - sadece katılmış kullanıcılar (Gereksinim 12, 15, 19)"""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="event_reviews",
    )
    event = models.ForeignKey(
        "events.Event",
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    reservation = models.OneToOneField(
        "reservations.Reservation",
        on_delete=models.SET_NULL,
        null=True,
        related_name="review",
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField()
    is_approved = models.BooleanField(default=True)
    helpful_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "event_reviews"
        unique_together = ("user", "event")
        verbose_name = "Etkinlik Yorumu"
        verbose_name_plural = "Etkinlik Yorumları"
        indexes = [
            models.Index(fields=["event", "is_approved"], name="event_reviews_event_idx"),
            models.Index(fields=["rating"], name="event_reviews_rating_idx"),
            BrinIndex(fields=["created_at"], name="event_reviews_created_brin"),
        ]

    def __str__(self):
        return f"{self.user.email} → {self.event.title} ({self.rating}★)"


class ReviewReply(models.Model):
    """Yoruma yanıt - galeri yöneticisi veya etkinlik sorumlusu (Gereksinim 14)"""

    REVIEW_TYPE_CHOICES = [
        ("artwork", "Eser Yorumu"),
        ("event", "Etkinlik Yorumu"),
    ]

    replied_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="review_replies",
    )
    review_type = models.CharField(max_length=10, choices=REVIEW_TYPE_CHOICES)
    artwork_review = models.OneToOneField(
        ArtworkReview,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="reply",
    )
    event_review = models.OneToOneField(
        EventReview,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="reply",
    )
    reply_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "review_replies"
        verbose_name = "Yorum Yanıtı"

    def __str__(self):
        return f"Yanıt #{self.id} - {self.replied_by.email}"


class ReviewVote(models.Model):
    """Yorumu faydalı bulma oyu (Gereksinim 13)"""

    VOTE_TYPE_CHOICES = [
        ("helpful", "Faydalı"),
        ("not_helpful", "Faydasız"),
    ]

    REVIEW_TYPE_CHOICES = [
        ("artwork", "Eser Yorumu"),
        ("event", "Etkinlik Yorumu"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="review_votes",
    )
    review_type = models.CharField(max_length=10, choices=REVIEW_TYPE_CHOICES)
    artwork_review = models.ForeignKey(
        ArtworkReview,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="votes",
    )
    event_review = models.ForeignKey(
        EventReview,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="votes",
    )
    vote = models.CharField(max_length=15, choices=VOTE_TYPE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "review_votes"
        unique_together = [("user", "artwork_review"), ("user", "event_review")]

    def __str__(self):
        return f"{self.user.email} - {self.vote}"
