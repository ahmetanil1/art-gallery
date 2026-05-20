from django.conf import settings
from django.contrib.postgres.indexes import BrinIndex
from django.db import models


class Notification(models.Model):
    """Bildirim modeli"""

    TYPE_CHOICES = [
        # Admin'e giden bildirimler
        ("new_order",       "Yeni Sipariş"),
        ("new_reservation", "Yeni Rezervasyon"),
        ("new_support",     "Yeni Destek Talebi"),
        ("new_review",      "Yeni Yorum"),
        # Kullanıcıya giden bildirimler
        ("order_paid",      "Sipariş Ödendi"),
        ("order_shipped",   "Sipariş Kargoya Verildi"),
        ("order_delivered", "Sipariş Teslim Edildi"),
        ("order_cancelled", "Sipariş İptal Edildi"),
        ("reservation_confirmed", "Rezervasyon Onaylandı"),
        ("reservation_cancelled", "Rezervasyon İptal Edildi"),
        ("support_replied", "Destek Yanıtı"),
        ("general",         "Genel"),
    ]

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)

    # Tıklanınca gidilecek URL (frontend route)
    action_url = models.CharField(max_length=300, blank=True)

    # İlgili nesne referansları (opsiyonel)
    order_id       = models.IntegerField(null=True, blank=True)
    reservation_id = models.IntegerField(null=True, blank=True)
    support_id     = models.IntegerField(null=True, blank=True)
    review_id      = models.IntegerField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications"
        verbose_name = "Bildirim"
        verbose_name_plural = "Bildirimler"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient", "is_read"], name="notifs_recipient_read_idx"),
            BrinIndex(fields=["created_at"], name="notifs_created_at_brin"),
        ]

    def __str__(self):
        return f"[{self.notification_type}] {self.recipient.email} — {self.title}"
