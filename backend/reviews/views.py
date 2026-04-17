from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import ArtworkReview, EventReview, ReviewReply, ReviewVote
from .serializers import (
    ArtworkReviewSerializer,
    EventReviewSerializer,
    ReviewReplyCreateSerializer,
    ReviewVoteSerializer,
)


class IsAuthenticatedOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated


class ArtworkReviewViewSet(viewsets.ModelViewSet):
    """
    Gereksinim 12 - Yorum ekleme
    Gereksinim 13 - Yorumları değerlendirme ve filtreleme
    Gereksinim 15 - Doğrulama
    Gereksinim 19 - Güvenilirlik
    """

    serializer_class = ArtworkReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["created_at", "rating", "helpful_count"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = ArtworkReview.objects.select_related("user").prefetch_related(
            "reply", "votes"
        ).filter(is_approved=True)

        artwork_id = self.request.query_params.get("artwork")
        if artwork_id:
            qs = qs.filter(artwork_id=artwork_id)
        return qs

    def get_permissions(self):
        if self.action in ("update", "partial_update", "destroy"):
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.user == request.user

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def vote(self, request, pk=None):
        """Gereksinim 13 - Faydalı bulma oyu"""
        review = self.get_object()
        data = {
            "review_type": "artwork",
            "artwork_review": review.id,
            "vote": request.data.get("vote", "helpful"),
        }
        serializer = ReviewVoteSerializer(data=data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(
        detail=True, methods=["post"],
        permission_classes=[permissions.IsAuthenticated],
        url_path="reply",
    )
    def add_reply(self, request, pk=None):
        """Gereksinim 14 - Yoruma yanıt"""
        if request.user.role not in ("admin", "gallery_manager"):
            return Response(status=status.HTTP_403_FORBIDDEN)
        review = self.get_object()
        data = {
            "review_type": "artwork",
            "artwork_review": review.id,
            "reply_text": request.data.get("reply_text", ""),
        }
        serializer = ReviewReplyCreateSerializer(data=data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class EventReviewViewSet(viewsets.ModelViewSet):
    """
    Gereksinim 12 - Etkinlik yorumu
    Gereksinim 13 - Filtreleme
    Gereksinim 19 - Katılım doğrulama
    """

    serializer_class = EventReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ["created_at", "rating", "helpful_count"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = EventReview.objects.select_related("user").prefetch_related(
            "reply", "votes"
        ).filter(is_approved=True)

        event_id = self.request.query_params.get("event")
        if event_id:
            qs = qs.filter(event_id=event_id)
        return qs

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def vote(self, request, pk=None):
        """Gereksinim 13"""
        review = self.get_object()
        data = {
            "review_type": "event",
            "event_review": review.id,
            "vote": request.data.get("vote", "helpful"),
        }
        serializer = ReviewVoteSerializer(data=data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(
        detail=True, methods=["post"],
        permission_classes=[permissions.IsAuthenticated],
        url_path="reply",
    )
    def add_reply(self, request, pk=None):
        """Gereksinim 14"""
        if request.user.role not in ("admin", "gallery_manager"):
            return Response(status=status.HTTP_403_FORBIDDEN)
        review = self.get_object()
        data = {
            "review_type": "event",
            "event_review": review.id,
            "reply_text": request.data.get("reply_text", ""),
        }
        serializer = ReviewReplyCreateSerializer(data=data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
