"""
Bildirim oluşturma ve WebSocket üzerinden push yardımcıları.
"""
import json
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Notification


def _push_ws(user_id: int, payload: dict):
    """Kullanıcının WebSocket kanalına anlık bildirim gönder."""
    try:
        layer = get_channel_layer()
        async_to_sync(layer.group_send)(
            f"notifs_{user_id}",
            {"type": "notify", **payload},
        )
    except Exception:
        pass  # WS bağlı değilse sessizce geç


def send_notification(
    recipient,
    notification_type: str,
    title: str,
    message: str,
    action_url: str = "",
    order_id: int = None,
    reservation_id: int = None,
    support_id: int = None,
    review_id: int = None,
) -> Notification:
    """Bildirim oluştur ve WebSocket ile push et."""
    notif = Notification.objects.create(
        recipient=recipient,
        notification_type=notification_type,
        title=title,
        message=message,
        action_url=action_url,
        order_id=order_id,
        reservation_id=reservation_id,
        support_id=support_id,
        review_id=review_id,
    )

    _push_ws(recipient.pk, {
        "id": notif.id,
        "notification_type": notif.notification_type,
        "title": notif.title,
        "message": notif.message,
        "action_url": notif.action_url,
        "order_id": notif.order_id,
        "reservation_id": notif.reservation_id,
        "support_id": notif.support_id,
        "review_id": notif.review_id,
        "created_at": notif.created_at.isoformat(),
        "is_read": False,
    })

    return notif


def notify_admins(
    notification_type: str,
    title: str,
    message: str,
    action_url: str = "",
    **kwargs,
):
    """Tüm admin ve galeri yöneticilerine bildirim gönder."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    admins = User.objects.filter(
        role__in=("admin", "gallery_manager"), is_active=True
    )
    for admin in admins:
        send_notification(
            recipient=admin,
            notification_type=notification_type,
            title=title,
            message=message,
            action_url=action_url,
            **kwargs,
        )
