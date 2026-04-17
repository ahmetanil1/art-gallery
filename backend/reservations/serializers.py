from django.utils import timezone
from rest_framework import serializers

from events.models import Event
from .models import Reservation, ReservationHistory


class ReservationCreateSerializer(serializers.ModelSerializer):
    """Gereksinim 4 - Rezervasyon oluşturma"""

    class Meta:
        model = Reservation
        fields = ("id", "event", "participant_count", "notes")

    def validate(self, attrs):
        event = attrs["event"]
        count = attrs.get("participant_count", 1)

        if event.status != "upcoming":
            raise serializers.ValidationError("Bu etkinlik için rezervasyon yapılamaz.")
        if event.start_datetime <= timezone.now():
            raise serializers.ValidationError("Geçmiş tarihli etkinlik için rezervasyon yapılamaz.")
        if event.available_slots < count:
            raise serializers.ValidationError(
                f"Yeterli kontenjan yok. Mevcut: {event.available_slots}"
            )
        return attrs

    def create(self, validated_data):
        return Reservation.objects.create(
            user=self.context["request"].user, **validated_data
        )


class ReservationUpdateSerializer(serializers.ModelSerializer):
    """Gereksinim 5 - Rezervasyon güncelleme"""

    class Meta:
        model = Reservation
        fields = ("participant_count", "notes")

    def validate_participant_count(self, value):
        reservation = self.instance
        event = reservation.event
        # Mevcut rezervasyonu hariç tut
        current_slots = event.available_slots + reservation.participant_count
        if value > current_slots:
            raise serializers.ValidationError(
                f"Yeterli kontenjan yok. Mevcut: {current_slots}"
            )
        return value


class ReservationSerializer(serializers.ModelSerializer):
    """Gereksinim 8 - Rezervasyon takibi"""

    event_title = serializers.CharField(source="event.title", read_only=True)
    event_date = serializers.DateTimeField(source="event.start_datetime", read_only=True)
    event_location = serializers.CharField(source="event.location", read_only=True)
    total_price = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )

    class Meta:
        model = Reservation
        fields = (
            "id", "event", "event_title", "event_date", "event_location",
            "participant_count", "status", "notes",
            "total_price", "reserved_at", "updated_at",
            "cancelled_at", "cancellation_reason",
        )
        read_only_fields = ("status", "reserved_at", "updated_at", "cancelled_at")


class ReservationHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ReservationHistory
        fields = "__all__"
