"""
Django signal'ları ile otomatik bildirim tetikleyicileri.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver


# ── Sipariş ──────────────────────────────────────────────────────────────────

@receiver(post_save, sender="orders.Order")
def order_signals(sender, instance, created, **kwargs):
    from .utils import send_notification, notify_admins

    if created:
        # Yeni sipariş → admin'e
        notify_admins(
            notification_type="new_order",
            title="Yeni Sipariş",
            message=f"{instance.user.get_full_name() or instance.user.email} yeni bir sipariş oluşturdu. "
                    f"Tutar: ₺{instance.total_amount:,.0f}",
            action_url=f"/admin/orders/{instance.id}",
            order_id=instance.id,
        )
    else:
        # Durum değişikliği → kullanıcıya
        STATUS_MAP = {
            "paid":      ("order_paid",      "Siparişiniz Ödendi",             f"#{instance.id} numaralı siparişiniz onaylandı."),
            "shipped":   ("order_shipped",   "Siparişiniz Kargoya Verildi",    f"#{instance.id} numaralı siparişiniz kargoya verildi."),
            "delivered": ("order_delivered", "Siparişiniz Teslim Edildi",      f"#{instance.id} numaralı siparişiniz teslim edildi."),
            "cancelled": ("order_cancelled", "Siparişiniz İptal Edildi",       f"#{instance.id} numaralı siparişiniz iptal edildi."),
        }
        if instance.status in STATUS_MAP:
            ntype, title, msg = STATUS_MAP[instance.status]
            send_notification(
                recipient=instance.user,
                notification_type=ntype,
                title=title,
                message=msg,
                action_url="/orders",
                order_id=instance.id,
            )


# ── Rezervasyon ──────────────────────────────────────────────────────────────

@receiver(post_save, sender="reservations.Reservation")
def reservation_signals(sender, instance, created, **kwargs):
    from .utils import send_notification, notify_admins

    if created:
        # Yeni rezervasyon → admin'e
        notify_admins(
            notification_type="new_reservation",
            title="Yeni Rezervasyon",
            message=f"{instance.user.get_full_name() or instance.user.email} "
                    f"'{instance.event.title}' etkinliğine {instance.participant_count} kişilik rezervasyon yaptı.",
            action_url=f"/admin/events",
            reservation_id=instance.id,
        )
    else:
        STATUS_MAP = {
            "confirmed": ("reservation_confirmed", "Rezervasyonunuz Onaylandı",
                          f"'{instance.event.title}' etkinliği için rezervasyonunuz onaylandı."),
            "cancelled": ("reservation_cancelled", "Rezervasyonunuz İptal Edildi",
                          f"'{instance.event.title}' etkinliği için rezervasyonunuz iptal edildi."),
        }
        if instance.status in STATUS_MAP:
            ntype, title, msg = STATUS_MAP[instance.status]
            send_notification(
                recipient=instance.user,
                notification_type=ntype,
                title=title,
                message=msg,
                action_url="/reservations",
                reservation_id=instance.id,
            )


# ── Destek Talebi ─────────────────────────────────────────────────────────────

@receiver(post_save, sender="support.SupportTicket")
def support_ticket_signals(sender, instance, created, **kwargs):
    from .utils import notify_admins
    if created:
        notify_admins(
            notification_type="new_support",
            title="Yeni Destek Talebi",
            message=f"{instance.user.get_full_name() or instance.user.email}: \"{instance.subject}\"",
            action_url="/support",
            support_id=instance.id,
        )


@receiver(post_save, sender="support.SupportMessage")
def support_message_signals(sender, instance, created, **kwargs):
    from .utils import send_notification
    if not created:
        return
    # Personel yanıtı → kullanıcıya bildirim
    if instance.is_staff_reply:
        send_notification(
            recipient=instance.ticket.user,
            notification_type="support_replied",
            title="Destek Talebinize Yanıt Geldi",
            message=f"\"{instance.ticket.subject}\" talebinize yanıt verildi.",
            action_url="/support",
            support_id=instance.ticket.id,
        )


# ── Yorum ─────────────────────────────────────────────────────────────────────

@receiver(post_save, sender="reviews.ArtworkReview")
def artwork_review_signals(sender, instance, created, **kwargs):
    from .utils import notify_admins
    if created:
        notify_admins(
            notification_type="new_review",
            title="Yeni Eser Yorumu",
            message=f"{instance.user.get_full_name() or instance.user.email} "
                    f"'{instance.artwork.title}' eserine {instance.rating}★ yorum yaptı.",
            action_url=f"/artworks/{instance.artwork.id}",
            review_id=instance.id,
        )
