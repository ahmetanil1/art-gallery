from rest_framework import serializers

from .models import Artist, Artwork, ArtworkComparison, ArtworkImage, Category, Favorite


class ArtistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Artist
        fields = "__all__"


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"


class ArtworkImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArtworkImage
        fields = ("id", "image", "is_primary", "order")


class ArtworkListSerializer(serializers.ModelSerializer):
    """Liste görünümü için hafif serializer"""

    artist_name = serializers.CharField(source="artist.name", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Artwork
        fields = (
            "id", "title", "artist_name", "category_name",
            "price", "status", "view_count", "primary_image", "created_at",
        )

    def get_primary_image(self, obj):
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if img:
            request = self.context.get("request")
            return request.build_absolute_uri(img.image.url) if request else img.image.url
        return None


class ArtworkDetailSerializer(serializers.ModelSerializer):
    """Detay görünümü - Gereksinim 1"""

    artist = ArtistSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    images = ArtworkImageSerializer(many=True, read_only=True)
    artist_id = serializers.PrimaryKeyRelatedField(
        queryset=Artist.objects.all(), source="artist", write_only=True
    )
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source="category", write_only=True, required=False
    )
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    is_favorited = serializers.SerializerMethodField()

    class Meta:
        model = Artwork
        fields = (
            "id", "title", "artist", "artist_id", "category", "category_id",
            "description", "year_created", "medium", "dimensions",
            "price", "status", "view_count", "images",
            "avg_rating", "review_count", "is_favorited", "created_at", "updated_at",
        )

    def get_avg_rating(self, obj):
        reviews = obj.reviews.filter(is_approved=True)
        if not reviews.exists():
            return None
        return round(reviews.aggregate(
            avg=__import__("django.db.models", fromlist=["Avg"]).Avg("rating")
        )["avg"], 2)

    def get_review_count(self, obj):
        return obj.reviews.filter(is_approved=True).count()

    def get_is_favorited(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.favorited_by.filter(user=request.user).exists()
        return False


class FavoriteSerializer(serializers.ModelSerializer):
    """Favoriler - Gereksinim 3"""

    artwork = ArtworkListSerializer(read_only=True)
    artwork_id = serializers.PrimaryKeyRelatedField(
        queryset=Artwork.objects.all(), source="artwork", write_only=True
    )

    class Meta:
        model = Favorite
        fields = ("id", "artwork", "artwork_id", "created_at")

    def validate(self, attrs):
        user = self.context["request"].user
        if Favorite.objects.filter(user=user, artwork=attrs["artwork"]).exists():
            raise serializers.ValidationError("Bu eser zaten favorilerinizde.")
        return attrs

    def create(self, validated_data):
        return Favorite.objects.create(user=self.context["request"].user, **validated_data)


class ArtworkComparisonSerializer(serializers.ModelSerializer):
    """Eser karşılaştırma - Gereksinim 11"""

    artworks = ArtworkListSerializer(many=True, read_only=True)
    artwork_ids = serializers.PrimaryKeyRelatedField(
        queryset=Artwork.objects.all(), source="artworks",
        many=True, write_only=True
    )

    class Meta:
        model = ArtworkComparison
        fields = ("id", "name", "artworks", "artwork_ids", "saved_at")

    def validate_artwork_ids(self, value):
        if len(value) < 2:
            raise serializers.ValidationError("En az 2 eser seçmelisiniz.")
        if len(value) > 4:
            raise serializers.ValidationError("En fazla 4 eser karşılaştırabilirsiniz.")
        return value

    def create(self, validated_data):
        artworks = validated_data.pop("artworks")
        comparison = ArtworkComparison.objects.create(
            user=self.context["request"].user, **validated_data
        )
        comparison.artworks.set(artworks)
        return comparison
