import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { artworkService } from "../services/artworkService";
import { orderService } from "../services/orderService";
import { reviewService } from "../services/reviewService";
import { useAuthStore } from "../store/authStore";
import type { Artwork, Review } from "../types";
import StarRating from "../components/StarRating";

export default function ArtworkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewOrdering, setReviewOrdering] = useState("-created_at");
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [buying, setBuying] = useState(false);
  const [payMethod, setPayMethod] = useState("credit_card");

  useEffect(() => {
    if (!id) return;
    artworkService.detail(Number(id)).then(setArtwork).catch(() => toast.error("Eser bulunamadı."));
    loadReviews();
  }, [id]);

  useEffect(() => { if (id) loadReviews(); }, [reviewOrdering]);

  const loadReviews = async () => {
    const data = await reviewService.getArtworkReviews(Number(id), reviewOrdering);
    setReviews(data.results ?? data);
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) { navigate("/login"); return; }
    try {
      await artworkService.addFavorite(Number(id));
      toast.success("Favorilere eklendi!");
      setArtwork((a) => a ? { ...a, is_favorited: true } : a);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Hata oluştu.");
    }
  };

  const handleBuy = async () => {
    if (!isAuthenticated) { navigate("/login"); return; }
    setBuying(true);
    try {
      const order = await orderService.create({
        items: [{ artwork: Number(id), quantity: 1 }],
        payment_method: payMethod,
      });
      await orderService.pay(order.id, payMethod);
      toast.success("Satın alma başarılı! 🎉");
      navigate("/orders");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Satın alma başarısız.");
    } finally {
      setBuying(false);
    }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate("/login"); return; }
    try {
      await reviewService.createArtworkReview({ artwork: Number(id), rating: newRating, comment: newComment });
      toast.success("Yorumunuz eklendi!");
      setNewComment("");
      loadReviews();
    } catch (err: any) {
      toast.error(err.response?.data?.non_field_errors?.[0] || "Yorum eklenemedi.");
    }
  };

  const handleVote = async (reviewId: number) => {
    if (!isAuthenticated) { navigate("/login"); return; }
    try {
      await reviewService.voteArtworkReview(reviewId, "helpful");
      toast.success("Oy verildi!");
      loadReviews();
    } catch (err: any) {
      toast.error(err.response?.data?.non_field_errors?.[0] || "Hata.");
    }
  };

  if (!artwork) return <div style={styles.loading}>Yükleniyor...</div>;

  return (
    <div style={styles.page}>
      <div style={styles.top}>
        {/* Sol: Görsel */}
        <div style={styles.imgSection}>
          {artwork.primary_image ? (
            <img src={artwork.primary_image} alt={artwork.title} style={styles.img} />
          ) : (
            <div style={styles.noImg}>🖼️</div>
          )}
        </div>

        {/* Sağ: Bilgiler */}
        <div style={styles.info}>
          <h1 style={styles.title}>{artwork.title}</h1>
          <p style={styles.artist}>👨‍🎨 {artwork.artist_name}</p>
          {artwork.avg_rating && (
            <div style={{ marginBottom: 8 }}>
              <StarRating rating={Math.round(artwork.avg_rating)} size={20} />
              <span style={{ marginLeft: 8, color: "#666", fontSize: 13 }}>
                {artwork.avg_rating} ({artwork.review_count} yorum)
              </span>
            </div>
          )}
          <p style={styles.desc}>{artwork.description}</p>
          <div style={styles.meta}>
            {artwork.medium && <span>🎨 {artwork.medium}</span>}
            {artwork.dimensions && <span>📐 {artwork.dimensions}</span>}
            <span>👁️ {artwork.view_count} görüntülenme</span>
          </div>
          <div style={styles.priceRow}>
            <span style={styles.price}>₺{Number(artwork.price).toLocaleString()}</span>
            <span style={{ ...styles.statusBadge, background: artwork.status === "available" ? "#27ae60" : "#e74c3c" }}>
              {artwork.status === "available" ? "Satışta" : "Satışa Kapalı"}
            </span>
          </div>

          {artwork.status === "available" && (
            <div style={styles.buySection}>
              <select style={styles.select} value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                <option value="credit_card">Kredi Kartı</option>
                <option value="debit_card">Banka Kartı</option>
                <option value="bank_transfer">Havale/EFT</option>
              </select>
              <button style={styles.buyBtn} onClick={handleBuy} disabled={buying}>
                {buying ? "İşleniyor..." : "🛒 Satın Al"}
              </button>
            </div>
          )}

          <button
            style={{ ...styles.favBtn, background: artwork.is_favorited ? "#ffeef0" : "#f5f5f5" }}
            onClick={handleFavorite}
          >
            {artwork.is_favorited ? "❤️ Favorilerde" : "🤍 Favorilere Ekle"}
          </button>
        </div>
      </div>

      {/* Yorumlar */}
      <div style={styles.reviewSection}>
        <div style={styles.reviewHeader}>
          <h2>💬 Yorumlar</h2>
          <select style={styles.select} value={reviewOrdering} onChange={(e) => setReviewOrdering(e.target.value)}>
            <option value="-created_at">En Yeni</option>
            <option value="-rating">En Yüksek Puan</option>
            <option value="-helpful_count">En Faydalı</option>
          </select>
        </div>

        {/* Yorum formu */}
        {isAuthenticated && (
          <form onSubmit={handleReview} style={styles.reviewForm}>
            <div>
              <label style={styles.label}>Puanınız</label>
              <StarRating rating={newRating} interactive onChange={setNewRating} size={28} />
            </div>
            <textarea
              style={styles.textarea}
              placeholder="Yorumunuzu yazın..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              required
              rows={3}
            />
            <button style={styles.submitBtn} type="submit">Yorum Ekle</button>
          </form>
        )}

        {reviews.length === 0 ? (
          <p style={{ color: "#999", textAlign: "center", padding: 20 }}>Henüz yorum yok.</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} style={styles.reviewCard}>
              <div style={styles.reviewTop}>
                <strong>{r.user_name}</strong>
                <StarRating rating={r.rating} />
                {r.is_verified_purchase && <span style={styles.verified}>✅ Doğrulanmış Alım</span>}
                <span style={styles.date}>{new Date(r.created_at).toLocaleDateString("tr-TR")}</span>
              </div>
              <p style={styles.reviewText}>{r.comment}</p>
              {r.reply && (
                <div style={styles.reply}>
                  <strong>Galeri Yanıtı:</strong> {r.reply.reply_text}
                </div>
              )}
              <button style={styles.helpfulBtn} onClick={() => handleVote(r.id)}>
                👍 Faydalı ({r.helpful_count})
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 1100, margin: "0 auto", padding: "24px 16px" },
  loading: { textAlign: "center", padding: 80, fontSize: 18, color: "#999" },
  top: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, marginBottom: 40 },
  imgSection: { borderRadius: 12, overflow: "hidden", background: "#f5f5f5", minHeight: 400 },
  img: { width: "100%", height: "100%", objectFit: "cover" },
  noImg: { display: "flex", alignItems: "center", justifyContent: "center", height: 400, fontSize: 80 },
  info: { display: "flex", flexDirection: "column", gap: 12 },
  title: { fontSize: 28, color: "#1a1a2e", margin: 0 },
  artist: { fontSize: 16, color: "#666" },
  desc: { fontSize: 14, color: "#444", lineHeight: 1.6 },
  meta: { display: "flex", gap: 16, fontSize: 13, color: "#888", flexWrap: "wrap" },
  priceRow: { display: "flex", alignItems: "center", gap: 16 },
  price: { fontSize: 28, fontWeight: 700, color: "#e94560" },
  statusBadge: { color: "#fff", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600 },
  buySection: { display: "flex", gap: 10 },
  select: { padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14 },
  buyBtn: { flex: 1, padding: "10px 20px", background: "#e94560", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, cursor: "pointer", fontWeight: 600 },
  favBtn: { padding: "10px 20px", border: "1px solid #ddd", borderRadius: 8, cursor: "pointer", fontSize: 14 },
  reviewSection: { borderTop: "2px solid #f0f0f0", paddingTop: 32 },
  reviewHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  reviewForm: { background: "#f9f9f9", padding: 20, borderRadius: 10, marginBottom: 20, display: "flex", flexDirection: "column", gap: 12 },
  label: { fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 },
  textarea: { padding: 12, borderRadius: 8, border: "1px solid #ddd", fontSize: 14, resize: "vertical" },
  submitBtn: { alignSelf: "flex-start", padding: "10px 24px", background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 },
  reviewCard: { background: "#fff", border: "1px solid #eee", borderRadius: 10, padding: 16, marginBottom: 12 },
  reviewTop: { display: "flex", gap: 12, alignItems: "center", marginBottom: 8, flexWrap: "wrap" },
  verified: { fontSize: 12, color: "#27ae60", background: "#eafaf1", padding: "2px 8px", borderRadius: 10 },
  date: { fontSize: 12, color: "#aaa", marginLeft: "auto" },
  reviewText: { fontSize: 14, color: "#444", lineHeight: 1.6 },
  reply: { background: "#f0f4ff", padding: "10px 14px", borderRadius: 8, fontSize: 13, color: "#333", marginTop: 8 },
  helpfulBtn: { background: "none", border: "1px solid #ddd", borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 12, marginTop: 8, color: "#666" },
};
