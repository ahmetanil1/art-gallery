from rest_framework import serializers

from .models import ArtworkReview, EventReview, ReviewReply, ReviewVote


class ReviewReplySerializer(serializers.ModelSerializer):
    replied_by_name = serializers.CharField(
        source="replied_by.get_full_name", read_only=True
    )

    class Meta:
        model = ReviewReply
        fields = (
            "id", "replied_by", "replied_by_name", "review_type",
            "reply_text", "created_at",
        )
        read_only_fields = ("replied_by",)


class ArtworkReviewSerializer(serializers.ModelSerializer):
    """Gereksinim 12, 13, 14, 15, 19"""

    user_name = serializers.CharField(source="user.get_full_name", read_only=True)
    reply = ReviewReplySerializer(read_only=True)
    user_vote = serializers.SerializerMethodField()

    class Meta:
        model = ArtworkReview
        fields = (
            "id", "user", "user_name", "artwork", "rating", "comment",
            "is_verified_purchase", "is_approved", "helpful_count",
            "reply", "user_vote", "created_at", "updated_at",
        )
        read_only_fields = (
            "user", "is_verified_purchase", "is_approved",
            "helpful_count", "created_at", "updated_at",
        )

    def get_user_vote(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            vote = obj.votes.filter(user=request.user).first()
            return vote.vote if vote else None
        return None

    def validate(self, attrs):
        """Gereksinim 19 - Doğrulama: sadece satın almış kullanıcılar doğrulanmış yorum yapabilir"""
        user = self.context["request"].user
        artwork = attrs.get("artwork")

        if ArtworkReview.objects.filter(user=user, artwork=artwork).exists():
            raise serializers.ValidationError("Bu eser için zaten yorum yaptınız.")

        # Satın alınmış mı kontrol et
        from orders.models import OrderItem
        is_purchased = OrderItem.objects.filter(
            order__user=user,
            order__status__in=["paid", "delivered"],
            artwork=artwork,
        ).exists()
        attrs["is_verified_purchase"] = is_purchased
        return attrs

    def create(self, validated_data):
        return ArtworkReview.objects.create(
            user=self.context["request"].user, **validated_data
        )


class EventReviewSerializer(serializers.ModelSerializer):
    """Gereksinim 12, 15, 19 - Etkinlik yorumu (sadece katılmış kullanıcılar)"""

    user_name = serializers.CharField(source="user.get_full_name", read_only=True)
    reply = ReviewReplySerializer(read_only=True)
    user_vote = serializers.SerializerMethodField()

    class Meta:
        model = EventReview
        fields = (
            "id", "user", "user_name", "event", "reservation",
            "rating", "comment", "is_approved", "helpful_count",
            "reply", "user_vote", "created_at", "updated_at",
        )
        read_only_fields = (
            "user", "is_approved", "helpful_count", "created_at", "updated_at",
        )

    def get_user_vote(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            vote = obj.votes.filter(user=request.user).first()
            return vote.vote if vote else None
        return None

    def validate(self, attrs):
        """Gereksinim 19 - Etkinliğe katılmış olma zorunluluğu"""
        user = self.context["request"].user
        event = attrs.get("event")

        if EventReview.objects.filter(user=user, event=event).exists():
            raise serializers.ValidationError("Bu etkinlik için zaten yorum yaptınız.")

        from reservations.models import Reservation
        reservation = Reservation.objects.filter(
            user=user,
            event=event,
            status__in=["confirmed", "completed"],
        ).first()

        if not reservation:
            raise serializers.ValidationError(
                "Bu etkinliğe katılmadan yorum yapamazsınız."
            )
        attrs["reservation"] = reservation
        return attrs

    def create(self, validated_data):
        return EventReview.objects.create(
            user=self.context["request"].user, **validated_data
        )


class ReviewVoteSerializer(serializers.ModelSerializer):
    """Gereksinim 13 - Yorumu faydalı bulma"""

    class Meta:
        model = ReviewVote
        fields = ("id", "review_type", "artwork_review", "event_review", "vote")

    def validate(self, attrs):
        user = self.context["request"].user
        review_type = attrs.get("review_type")

        if review_type == "artwork" and attrs.get("artwork_review"):
            if ReviewVote.objects.filter(
                user=user, artwork_review=attrs["artwork_review"]
            ).exists():
                raise serializers.ValidationError("Bu yorumu zaten oyladınız.")
        elif review_type == "event" and attrs.get("event_review"):
            if ReviewVote.objects.filter(
                user=user, event_review=attrs["event_review"]
            ).exists():
                raise serializers.ValidationError("Bu yorumu zaten oyladınız.")
        return attrs

    def create(self, validated_data):
        vote = ReviewVote.objects.create(
            user=self.context["request"].user, **validated_data
        )
        # helpful_count güncelle
        if vote.review_type == "artwork" and vote.artwork_review:
            review = vote.artwork_review
            review.helpful_count = review.votes.filter(vote="helpful").count()
            review.save()
        elif vote.review_type == "event" and vote.event_review:
            review = vote.event_review
            review.helpful_count = review.votes.filter(vote="helpful").count()
            review.save()
        return vote


class ReviewReplyCreateSerializer(serializers.ModelSerializer):
    """Gereksinim 14 - Yoruma yanıt (galeri yöneticisi)"""

    class Meta:
        model = ReviewReply
        fields = (
            "id", "review_type", "artwork_review", "event_review",
            "reply_text", "created_at",
        )

    def create(self, validated_data):
        return ReviewReply.objects.create(
            replied_by=self.context["request"].user, **validated_data
        )
