"""
WebSocket consumer — Destek talebi canlı mesajlaşma
ws://host/ws/support/<ticket_id>/
"""
import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser


class SupportChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.ticket_id = self.scope["url_route"]["kwargs"]["ticket_id"]
        self.room_group = f"support_{self.ticket_id}"
        self.user = self.scope.get("user")

        # Kimlik doğrulama kontrolü
        if not self.user or isinstance(self.user, AnonymousUser) or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        # Kullanıcının bu talebe erişim hakkı var mı?
        has_access = await self._check_access()
        if not has_access:
            await self.close(code=4003)
            return

        # Gruba katıl
        await self.channel_layer.group_add(self.room_group, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "room_group"):
            await self.channel_layer.group_discard(self.room_group, self.channel_name)

    async def receive(self, text_data):
        """Kullanıcıdan mesaj geldi → DB'ye kaydet → gruba yayınla"""
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        message_text = (data.get("message") or "").strip()
        if not message_text:
            return

        # Ticket kapalıysa mesaj kabul etme
        ticket_status = await self._get_ticket_status()
        if ticket_status == "closed":
            await self.send(text_data=json.dumps({"error": "Kapalı talebe mesaj gönderilemez."}))
            return

        # DB'ye kaydet
        msg = await self._save_message(message_text)

        # Gruptaki herkese yayınla
        await self.channel_layer.group_send(
            self.room_group,
            {
                "type": "chat_message",
                "id": msg["id"],
                "message": msg["message"],
                "sender_id": msg["sender_id"],
                "sender_name": msg["sender_name"],
                "is_staff_reply": msg["is_staff_reply"],
                "created_at": msg["created_at"],
            },
        )

    async def chat_message(self, event):
        """Gruptan gelen mesajı WebSocket üzerinden istemciye ilet"""
        await self.send(text_data=json.dumps({
            "type": "message",
            "id": event["id"],
            "message": event["message"],
            "sender_id": event["sender_id"],
            "sender_name": event["sender_name"],
            "is_staff_reply": event["is_staff_reply"],
            "created_at": event["created_at"],
        }))

    # ── DB yardımcıları ──────────────────────────────────────────────────

    @database_sync_to_async
    def _check_access(self):
        from .models import SupportTicket
        user = self.user
        try:
            ticket = SupportTicket.objects.get(pk=self.ticket_id)
        except SupportTicket.DoesNotExist:
            return False
        # Sahibi veya yönetici
        return ticket.user_id == user.pk or user.role in ("admin", "gallery_manager")

    @database_sync_to_async
    def _get_ticket_status(self):
        from .models import SupportTicket
        try:
            return SupportTicket.objects.values_list("status", flat=True).get(pk=self.ticket_id)
        except SupportTicket.DoesNotExist:
            return "closed"

    @database_sync_to_async
    def _save_message(self, text):
        from .models import SupportMessage, SupportTicket
        user = self.user
        ticket = SupportTicket.objects.get(pk=self.ticket_id)
        is_staff = user.role in ("admin", "gallery_manager")

        msg = SupportMessage.objects.create(
            ticket=ticket,
            sender=user,
            message=text,
            is_staff_reply=is_staff,
        )

        # Ticket durumunu güncelle
        if ticket.status == "open":
            ticket.status = "in_progress"
            ticket.save(update_fields=["status"])

        full_name = user.get_full_name() or user.email
        return {
            "id": msg.id,
            "message": msg.message,
            "sender_id": user.pk,
            "sender_name": full_name,
            "is_staff_reply": is_staff,
            "created_at": msg.created_at.isoformat(),
        }
