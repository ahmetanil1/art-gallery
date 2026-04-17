from django.conf import settings
from django.contrib.postgres.indexes import BrinIndex, GinIndex
from django.contrib.postgres.search import SearchVectorField
from django.db import models


class Artist(models.Model):
    """Sanatçı bilgileri"""

    name = models.CharField(max_length=200)
    bio = models.TextField(blank=True)
    birth_year = models.IntegerField(null=True, blank=True)
    nationality = models.CharField(max_length=100, blank=True)
    profile_picture = models.ImageField(
        upload_to="artists/", null=True, blank=True
    )
    website = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "artists"
        verbose_name = "Sanatçı"
        verbose_name_plural = "Sanatçılar"
        indexes = [
            models.Index(fields=["name"], name="artists_name_idx"),
        ]

    def __str__(self):
        return self.name


class Category(models.Model):
    """Eser kategorileri"""

    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    slug = models.SlugField(unique=True)

    class Meta:
        db_table = "categories"
        verbose_name = "Kategori"
        verbose_name_plural = "Kategoriler"

    def __str__(self):
        return self.name


class Artwork(models.Model):
    """Sanat eseri - Eserleri İnceleme (Gereksinim 1)"""

    STATUS_CHOICES = [
        ("available", "Satışta"),
        ("sold", "Satıldı"),
        ("reserved", "Rezerve"),
        ("not_for_sale", "Satışa Kapalı"),
    ]

    title = models.CharField(max_length=300)
    artist = models.ForeignKey(
        Artist, on_delete=models.PROTECT, related_name="artworks"
    )
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, related_name="artworks"
    )
    description = models.TextField()
    year_created = models.IntegerField(null=True, blank=True)
    medium = models.CharField(max_length=200, blank=True)
    dimensions = models.CharField(max_length=100, blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="available"
    )
    view_count = models.PositiveIntegerField(default=0)
    # PostgreSQL full-text search vektörü
    search_vector = SearchVectorField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "artworks"
        verbose_name = "Eser"
        verbose_name_plural = "Eserler"
        indexes = [
            models.Index(fields=["status"], name="artworks_status_idx"),
            models.Index(fields=["artist"], name="artworks_artist_idx"),
            models.Index(fields=["category"], name="artworks_category_idx"),
            models.Index(fields=["price"], name="artworks_price_idx"),
            BrinIndex(fields=["created_at"], name="artworks_created_at_brin"),
            # Full-text search için GIN index
            GinIndex(fields=["search_vector"], name="artworks_search_gin"),
        ]

    def __str__(self):
        return f"{self.title} - {self.artist.name}"


class ArtworkImage(models.Model):
    """Eser görselleri"""

    artwork = models.ForeignKey(
        Artwork, on_delete=models.CASCADE, related_name="images"
    )
    image = models.ImageField(upload_to="artworks/")
    is_primary = models.BooleanField(default=False)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "artwork_images"
        ordering = ["order"]

    def __str__(self):
        return f"{self.artwork.title} - Görsel {self.order}"


class Favorite(models.Model):
    """Favorilere ekleme (Gereksinim 3)"""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="favorites",
    )
    artwork = models.ForeignKey(
        Artwork, on_delete=models.CASCADE, related_name="favorited_by"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "favorites"
        unique_together = ("user", "artwork")
        verbose_name = "Favori"
        verbose_name_plural = "Favoriler"
        indexes = [
            models.Index(fields=["user"], name="favorites_user_idx"),
        ]

    def __str__(self):
        return f"{self.user.email} → {self.artwork.title}"


class ArtworkComparison(models.Model):
    """Eser karşılaştırma (Gereksinim 11)"""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="artwork_comparisons",
    )
    artworks = models.ManyToManyField(Artwork, related_name="comparisons")
    saved_at = models.DateTimeField(auto_now_add=True)
    name = models.CharField(max_length=200, blank=True)

    class Meta:
        db_table = "artwork_comparisons"
        verbose_name = "Eser Karşılaştırma"

    def __str__(self):
        return f"{self.user.email} - Karşılaştırma {self.id}"
