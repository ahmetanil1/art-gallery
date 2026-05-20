from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = (
            "id", "notification_type", "title", "message",
            "is_read", "action_url",
            "order_id", "reservation_id", "support_id", "review_id",
            "created_at",
        )
        read_only_fields = fields
