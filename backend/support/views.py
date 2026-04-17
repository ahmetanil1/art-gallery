from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import SupportTicket
from .serializers import (
    SendMessageSerializer,
    SupportTicketListSerializer,
    SupportTicketSerializer,
)


class SupportTicketViewSet(viewsets.ModelViewSet):
    """Gereksinim 10 - Müşteri destek"""

    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Yöneticiler tüm talepleri görebilir
        if user.role in ("admin", "gallery_manager"):
            qs = SupportTicket.objects.prefetch_related("messages__sender")
            status_filter = self.request.query_params.get("status")
            if status_filter:
                qs = qs.filter(status=status_filter)
            return qs.order_by("-created_at")
        return SupportTicket.objects.filter(user=user).prefetch_related(
            "messages__sender"
        ).order_by("-created_at")

    def get_serializer_class(self):
        if self.action == "list":
            return SupportTicketListSerializer
        return SupportTicketSerializer

    # Kullanıcılar kendi taleplerini silemez
    http_method_names = ["get", "post", "head", "options"]

    @action(detail=True, methods=["post"])
    def send_message(self, request, pk=None):
        """Gereksinim 10 - Mesaj gönderme"""
        ticket = self.get_object()

        if ticket.status == "closed":
            return Response(
                {"detail": "Kapalı talebe mesaj gönderilemez."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = SendMessageSerializer(
            data=request.data,
            context={"request": request, "ticket": ticket},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Talebi "in_progress" yap
        if ticket.status == "open":
            ticket.status = "in_progress"
            ticket.save()

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def resolve(self, request, pk=None):
        """Talebi çözüldü olarak işaretle (yönetici)"""
        if request.user.role not in ("admin", "gallery_manager"):
            return Response(status=status.HTTP_403_FORBIDDEN)
        ticket = self.get_object()
        ticket.status = "resolved"
        ticket.resolved_at = timezone.now()
        ticket.save()
        return Response({"detail": "Talep çözüldü olarak işaretlendi."})
