from django.utils import timezone
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Reservation, ReservationHistory
from .serializers import (
    ReservationCreateSerializer,
    ReservationHistorySerializer,
    ReservationSerializer,
    ReservationUpdateSerializer,
)


class ReservationViewSet(viewsets.ModelViewSet):
    """
    Gereksinim 4 - Rezervasyon oluşturma
    Gereksinim 5 - Rezervasyon güncelleme / iptal
    Gereksinim 8 - Rezervasyon takibi
    """

    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Reservation.objects.select_related("event", "user")

        # Admin/galeri yöneticisi tüm rezervasyonları görebilir
        if user.role in ("admin", "gallery_manager"):
            event_id = self.request.query_params.get("event")
            status_filter = self.request.query_params.get("status")
            if event_id:
                qs = qs.filter(event_id=event_id)
            if status_filter:
                qs = qs.filter(status=status_filter)
            return qs.order_by("-reserved_at")

        # Normal kullanıcı sadece kendi rezervasyonlarını görür
        qs = qs.filter(user=user)
        status_filter = self.request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs.order_by("-reserved_at")

    def get_serializer_class(self):
        if self.action == "create":
            return ReservationCreateSerializer
        if self.action in ("update", "partial_update"):
            return ReservationUpdateSerializer
        return ReservationSerializer

    def perform_update(self, serializer):
        old = self.get_object()
        old_count = old.participant_count
        instance = serializer.save()
        # Geçmiş kaydı
        ReservationHistory.objects.create(
            reservation=instance,
            changed_by=self.request.user,
            old_status=instance.status,
            new_status=instance.status,
            old_participant_count=old_count,
            new_participant_count=instance.participant_count,
        )

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        """Gereksinim 5 - Rezervasyon iptal"""
        reservation = self.get_object()

        if reservation.status in ("cancelled", "completed"):
            return Response(
                {"detail": "Bu rezervasyon zaten iptal edilmiş veya tamamlanmış."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_status = reservation.status
        reservation.status = "cancelled"
        reservation.cancelled_at = timezone.now()
        reservation.cancellation_reason = request.data.get("reason", "")
        reservation.save()

        ReservationHistory.objects.create(
            reservation=reservation,
            changed_by=request.user,
            old_status=old_status,
            new_status="cancelled",
            old_participant_count=reservation.participant_count,
            new_participant_count=reservation.participant_count,
            note=reservation.cancellation_reason,
        )
        return Response({"detail": "Rezervasyon iptal edildi."})

    @action(detail=True, methods=["get"])
    def history(self, request, pk=None):
        """Gereksinim 8 - Rezervasyon geçmişi"""
        reservation = self.get_object()
        qs = ReservationHistory.objects.filter(reservation=reservation)
        serializer = ReservationHistorySerializer(qs, many=True)
        return Response(serializer.data)
