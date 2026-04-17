from django.conf import settings
from django.contrib.postgres.indexes import BrinIndex
from django.db import models


class SupportTicket(models.Model):
    """Destek talebi (Gereksinim 10)"""

    STATUS_CHOICES = [
        ("open", "Açık"),
        ("in_progress", "İşlemde"),
        ("resolved", "Çözüldü"),
        ("closed", "Kapatıldı"),
    ]

    CATEGORY_CHOICES = [
        ("order", "Sipariş"),
        ("reservation", "Rezervasyon"),
        ("payment", "Ödeme"),
        ("artwork", "Eser"),
        ("account", "Hesap"),
        ("other", "Diğer"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="support_tickets",
    )
    subject = models.CharField(max_length=300)
    category = models.CharField(
        max_length=20, choices=CATEGORY_CHOICES, default="other"
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="open"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "support_tickets"
        verbose_name = "Destek Talebi"
        verbose_name_plural = "Destek Talepleri"
        indexes = [
            models.Index(fields=["user", "status"], name="sup_tickets_user_status_idx"),
            BrinIndex(fields=["created_at"], name="sup_tickets_created_brin"),
        ]

    def __str__(self):
        return f"#{self.id} - {self.subject} ({self.status})"


class SupportMessage(models.Model):
    """Destek mesajı (Gereksinim 10)"""

    ticket = models.ForeignKey(
        SupportTicket, on_delete=models.CASCADE, related_name="messages"
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="support_messages",
    )
    message = models.TextField()
    is_staff_reply = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "support_messages"
        ordering = ["created_at"]
        indexes = [
            BrinIndex(fields=["created_at"], name="support_messages_created_brin"),
        ]

    def __str__(self):
        return f"Mesaj #{self.id} - Talep #{self.ticket.id}"
