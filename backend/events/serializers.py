from rest_framework import serializers

from .models import Event, EventCategory, EventComparison


class EventCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = EventCategory
        fields = "__all__"


class EventListSerializer(serializers.ModelSerializer):
    """Liste görünümü - Gereksinim 2"""

    category_name = serializers.CharField(source="category.name", read_only=True)
    organizer_name = serializers.CharField(source="organizer.get_full_name", read_only=True)
    available_slots = serializers.IntegerField(read_only=True)
    occupancy_rate = serializers.FloatField(read_only=True)

    class Meta:
        model = Event
        fields = (
            "id", "title", "event_type", "category_name", "organizer_name",
            "location", "start_datetime", "end_datetime",
            "capacity", "available_slots", "occupancy_rate",
            "price", "status", "image",
        )


class EventDetailSerializer(serializers.ModelSerializer):
    """Detay görünümü - Gereksinim 2"""

    category = EventCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=EventCategory.objects.all(), source="category", write_only=True, required=False
    )
    available_slots = serializers.IntegerField(read_only=True)
    occupancy_rate = serializers.FloatField(read_only=True)
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    total_reservations = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = (
            "id", "title", "description", "event_type",
            "category", "category_id", "organizer",
            "location", "start_datetime", "end_datetime",
            "capacity", "available_slots", "occupancy_rate",
            "price", "status", "image",
            "avg_rating", "review_count", "total_reservations",
            "created_at", "updated_at",
        )
        read_only_fields = ("organizer",)

    def get_avg_rating(self, obj):
        """Gereksinim 16"""
        reviews = obj.reviews.filter(is_approved=True)
        if not reviews.exists():
            return None
        from django.db.models import Avg
        return round(reviews.aggregate(avg=Avg("rating"))["avg"], 2)

    def get_review_count(self, obj):
        return obj.reviews.filter(is_approved=True).count()

    def get_total_reservations(self, obj):
        """Gereksinim 16"""
        return obj.reservations.filter(status__in=["confirmed", "completed"]).count()

    def create(self, validated_data):
        validated_data["organizer"] = self.context["request"].user
        return super().create(validated_data)


class EventComparisonSerializer(serializers.ModelSerializer):
    """Gereksinim 11 - Etkinlik karşılaştırma"""

    events = EventListSerializer(many=True, read_only=True)
    event_ids = serializers.PrimaryKeyRelatedField(
        queryset=Event.objects.all(), source="events", many=True, write_only=True
    )

    class Meta:
        model = EventComparison
        fields = ("id", "name", "events", "event_ids", "saved_at")

    def validate_event_ids(self, value):
        if len(value) < 2:
            raise serializers.ValidationError("En az 2 etkinlik seçmelisiniz.")
        if len(value) > 4:
            raise serializers.ValidationError("En fazla 4 etkinlik karşılaştırabilirsiniz.")
        return value

    def create(self, validated_data):
        events = validated_data.pop("events")
        comparison = EventComparison.objects.create(
            user=self.context["request"].user, **validated_data
        )
        comparison.events.set(events)
        return comparison
