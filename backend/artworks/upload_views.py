"""
Admin eser yükleme ve yönetim API'leri.
"""
from rest_framework import permissions, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import generics, serializers

from .models import Artwork, ArtworkImage, Artist, Category


class IsAdminOrManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ("admin", "gallery_manager")


# ── Serializers ────────────────────────────────────────────────────────────────

class ArtworkImageUploadSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ArtworkImage
        fields = ("id", "image", "image_url", "is_primary", "order")

    def get_image_url(self, obj):
        request = self.context.get("request")
        if obj.image:
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return None


class ArtworkCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Artwork
        fields = (
            "id", "title", "artist", "category", "description",
            "year_created", "medium", "dimensions", "price", "status",
        )


class ArtworkAdminDetailSerializer(serializers.ModelSerializer):
    images = ArtworkImageUploadSerializer(many=True, read_only=True)
    artist_name = serializers.CharField(source="artist.name", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Artwork
        fields = (
            "id", "title", "artist", "artist_name", "category", "category_name",
            "description", "year_created", "medium", "dimensions",
            "price", "status", "view_count", "images", "created_at", "updated_at",
        )


# ── Views ──────────────────────────────────────────────────────────────────────

class AdminArtworkCreateView(generics.CreateAPIView):
    """POST /api/admin/artworks/ — yeni eser oluştur"""
    permission_classes = [IsAdminOrManager]
    serializer_class = ArtworkCreateSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]


class AdminArtworkUpdateView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/admin/artworks/<id>/"""
    permission_classes = [IsAdminOrManager]
    queryset = Artwork.objects.select_related("artist", "category").prefetch_related("images")
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        if self.request.method == "GET":
            return ArtworkAdminDetailSerializer
        return ArtworkCreateSerializer


class AdminArtworkImageUploadView(APIView):
    """
    POST /api/admin/artworks/<id>/images/
    Bir esere görsel yükle. Dosya unique UUID ismiyle kaydedilir.
    """
    permission_classes = [IsAdminOrManager]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, artwork_id):
        try:
            artwork = Artwork.objects.get(pk=artwork_id)
        except Artwork.DoesNotExist:
            return Response({"detail": "Eser bulunamadı."}, status=status.HTTP_404_NOT_FOUND)

        images = request.FILES.getlist("images")
        if not images:
            return Response({"detail": "En az bir görsel yükleyin."}, status=status.HTTP_400_BAD_REQUEST)

        is_primary = request.data.get("is_primary", "false").lower() == "true"
        created = []

        for i, img_file in enumerate(images):
            # Eğer primary işaretliyse önce diğerlerini kaldır
            if is_primary and i == 0:
                ArtworkImage.objects.filter(artwork=artwork, is_primary=True).update(is_primary=False)

            order = ArtworkImage.objects.filter(artwork=artwork).count()
            img_obj = ArtworkImage.objects.create(
                artwork=artwork,
                image=img_file,
                is_primary=(is_primary and i == 0),
                order=order,
            )
            created.append(ArtworkImageUploadSerializer(img_obj, context={"request": request}).data)

        return Response({"uploaded": created, "count": len(created)}, status=status.HTTP_201_CREATED)

    def delete(self, request, artwork_id):
        """DELETE /api/admin/artworks/<id>/images/?image_id=<id>"""
        image_id = request.query_params.get("image_id")
        if not image_id:
            return Response({"detail": "image_id gerekli."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            img = ArtworkImage.objects.get(pk=image_id, artwork_id=artwork_id)
        except ArtworkImage.DoesNotExist:
            return Response({"detail": "Görsel bulunamadı."}, status=status.HTTP_404_NOT_FOUND)

        # Dosyayı diskten sil
        if img.image:
            import os
            if os.path.isfile(img.image.path):
                os.remove(img.image.path)
        img.delete()
        return Response({"detail": "Görsel silindi."})


class AdminArtworkSetPrimaryImageView(APIView):
    """POST /api/admin/artworks/<id>/images/<image_id>/set-primary/"""
    permission_classes = [IsAdminOrManager]

    def post(self, request, artwork_id, image_id):
        try:
            artwork = Artwork.objects.get(pk=artwork_id)
        except Artwork.DoesNotExist:
            return Response({"detail": "Eser bulunamadı."}, status=status.HTTP_404_NOT_FOUND)

        ArtworkImage.objects.filter(artwork=artwork).update(is_primary=False)
        try:
            img = ArtworkImage.objects.get(pk=image_id, artwork=artwork)
            img.is_primary = True
            img.save()
        except ArtworkImage.DoesNotExist:
            return Response({"detail": "Görsel bulunamadı."}, status=status.HTTP_404_NOT_FOUND)

        return Response({"detail": "Ana görsel güncellendi."})
