from django.conf import settings
from django.contrib.postgres.indexes import BrinIndex
from django.db import models


class Reservation(models.Model):
    """Rezervasyon (Gereksinim 4 & 5)"""

    STATUS_CHOICES = [
        ("pending", "Beklemede"),
        ("confirmed", "Onaylandı"),
        ("cancelled", "İptal Edildi"),
        ("completed", "Tamamlandı"),
        ("no_show", "Gelmedi"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reservations",
    )
    event = models.ForeignKey(
        "events.Event",
        on_delete=models.CASCADE,
        related_name="reservations",
    )
    participant_count = models.PositiveIntegerField(default=1)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="pending"
    )
    notes = models.TextField(blank=True)
    reserved_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.TextField(blank=True)

    class Meta:
        db_table = "reservations"
        verbose_name = "Rezervasyon"
        verbose_name_plural = "Rezervasyonlar"
        indexes = [
            models.Index(fields=["user", "status"], name="reservations_user_status_idx"),
            models.Index(fields=["event", "status"], name="reservations_event_status_idx"),
            BrinIndex(fields=["reserved_at"], name="reservations_reserved_at_brin"),
        ]

    def __str__(self):
        return f"{self.user.email} → {self.event.title} ({self.status})"

    @property
    def total_price(self):
        discount = self.discounts.filter(is_active=True).first()
        base = self.event.price * self.participant_count
        if discount:
            return base * (1 - discount.coupon.discount_rate / 100)
        return base


class ReservationHistory(models.Model):
    """Rezervasyon değişiklik geçmişi (Gereksinim 8)"""

    reservation = models.ForeignKey(
        Reservation, on_delete=models.CASCADE, related_name="history"
    )
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
    )
    old_status = models.CharField(max_length=20)
    new_status = models.CharField(max_length=20)
    old_participant_count = models.PositiveIntegerField(null=True)
    new_participant_count = models.PositiveIntegerField(null=True)
    changed_at = models.DateTimeField(auto_now_add=True)
    note = models.TextField(blank=True)

    class Meta:
        db_table = "reservation_history"
        ordering = ["-changed_at"]
        indexes = [
            BrinIndex(fields=["changed_at"], name="res_history_changed_at_brin"),
        ]

    def __str__(self):
        return (
            f"Rezervasyon #{self.reservation.id} - "
            f"{self.old_status} → {self.new_status}"
        )
