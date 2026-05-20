"""
WebSocket consumer — Anlık bildirimler
ws://host/ws/notifications/?token=<jwt>
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")

        if not self.user or isinstance(self.user, AnonymousUser) or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        self.group_name = f"notifs_{self.user.pk}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        """İstemciden ping veya mark_read gelebilir."""
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        if data.get("type") == "mark_read" and data.get("id"):
            await self._mark_read(data["id"])

    async def notify(self, event):
        """Gruptan gelen bildirimi istemciye ilet."""
        payload = {k: v for k, v in event.items() if k != "type"}
        payload["type"] = "notification"
        await self.send(text_data=json.dumps(payload))

    from channels.db import database_sync_to_async

    @database_sync_to_async
    def _mark_read(self, notif_id: int):
        from .models import Notification
        Notification.objects.filter(
            pk=notif_id, recipient=self.user
        ).update(is_read=True)
