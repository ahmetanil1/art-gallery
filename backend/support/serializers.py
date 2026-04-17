from rest_framework import serializers

from .models import SupportMessage, SupportTicket


class SupportMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.get_full_name", read_only=True)

    class Meta:
        model = SupportMessage
        fields = ("id", "sender", "sender_name", "message", "is_staff_reply", "created_at")
        read_only_fields = ("sender", "is_staff_reply", "created_at")


class SupportTicketSerializer(serializers.ModelSerializer):
    """Gereksinim 10 - Müşteri destek"""

    messages = SupportMessageSerializer(many=True, read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = SupportTicket
        fields = (
            "id", "user", "user_email", "subject", "category",
            "status", "messages", "created_at", "updated_at", "resolved_at",
        )
        read_only_fields = ("user", "status", "created_at", "updated_at", "resolved_at")

    def create(self, validated_data):
        return SupportTicket.objects.create(
            user=self.context["request"].user, **validated_data
        )


class SupportTicketListSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicket
        fields = ("id", "subject", "category", "status", "created_at", "updated_at")


class SendMessageSerializer(serializers.ModelSerializer):
    """Gereksinim 10 - Mesaj gönderme"""

    class Meta:
        model = SupportMessage
        fields = ("id", "message", "created_at")

    def create(self, validated_data):
        ticket = self.context["ticket"]
        user = self.context["request"].user
        is_staff = user.role in ("admin", "gallery_manager")
        return SupportMessage.objects.create(
            ticket=ticket,
            sender=user,
            is_staff_reply=is_staff,
            **validated_data,
        )
