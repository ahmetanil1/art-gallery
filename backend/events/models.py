from django.conf import settings
from django.contrib.postgres.indexes import BrinIndex, GinIndex
from django.contrib.postgres.search import SearchVectorField
from django.db import models


class EventCategory(models.Model):
    """Etkinlik kategorisi"""

    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = "event_categories"

    def __str__(self):
        return self.name


class Event(models.Model):
    """Atölye ve Etkinlikler (Gereksinim 2)"""

    TYPE_CHOICES = [
        ("workshop", "Atölye"),
        ("exhibition", "Sergi"),
        ("seminar", "Seminer"),
        ("tour", "Tur"),
        ("other", "Diğer"),
    ]

    STATUS_CHOICES = [
        ("upcoming", "Yaklaşan"),
        ("ongoing", "Devam Eden"),
        ("completed", "Tamamlandı"),
        ("cancelled", "İptal Edildi"),
    ]

    title = models.CharField(max_length=300)
    description = models.TextField()
    event_type = models.CharField(
        max_length=20, choices=TYPE_CHOICES, default="workshop"
    )
    category = models.ForeignKey(
        EventCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="events",
    )
    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="organized_events",
    )
    location = models.CharField(max_length=300)
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    capacity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="upcoming"
    )
    image = models.ImageField(upload_to="events/", null=True, blank=True)
    # PostgreSQL full-text search vektörü
    search_vector = SearchVectorField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "events"
        verbose_name = "Etkinlik"
        verbose_name_plural = "Etkinlikler"
        indexes = [
            models.Index(fields=["status"], name="events_status_idx"),
            models.Index(fields=["event_type"], name="events_type_idx"),
            models.Index(fields=["price"], name="events_price_idx"),
            BrinIndex(fields=["start_datetime"], name="events_start_brin"),
            GinIndex(fields=["search_vector"], name="events_search_gin"),
        ]

    def __str__(self):
        return f"{self.title} ({self.start_datetime.date()})"

    @property
    def available_slots(self):
        confirmed = self.reservations.filter(
            status__in=["confirmed", "pending"]
        ).aggregate(total=models.Sum("participant_count"))["total"] or 0
        return self.capacity - confirmed

    @property
    def occupancy_rate(self):
        if self.capacity == 0:
            return 0
        confirmed = self.reservations.filter(
            status__in=["confirmed", "pending"]
        ).aggregate(total=models.Sum("participant_count"))["total"] or 0
        return round((confirmed / self.capacity) * 100, 2)


class EventComparison(models.Model):
    """Etkinlik karşılaştırma (Gereksinim 11)"""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="event_comparisons",
    )
    events = models.ManyToManyField(Event, related_name="comparisons")
    saved_at = models.DateTimeField(auto_now_add=True)
    name = models.CharField(max_length=200, blank=True)

    class Meta:
        db_table = "event_comparisons"
        verbose_name = "Etkinlik Karşılaştırma"

    def __str__(self):
        return f"{self.user.email} - Etkinlik Karşılaştırma {self.id}"
