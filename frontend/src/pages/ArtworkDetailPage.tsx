import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { artworkService } from "../services/artworkService";
import { orderService } from "../services/orderService";
import { reviewService } from "../services/reviewService";
import { useAuthStore } from "../store/authStore";
import type { Artwork, Review } from "../types";
import StarRating from "../components/StarRating";

const PAYMENT_METHODS = [
  { value: "credit_card",   label: "Kredi Kartı" },
  { value: "debit_card",    label: "Banka Kartı" },
  { value: "bank_transfer", label: "Havale / EFT" },
];

export default function ArtworkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewOrdering, setReviewOrdering] = useState("-created_at");
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");

  // Satın alma modal state
  const [showBuyModal, setShowBuyModal]     = useState(false);
  const [payMethod, setPayMethod]           = useState("credit_card");
  const [address, setAddress]               = useState("");
  const [couponInput, setCouponInput]       = useState("");
  const [couponData, setCouponData]         = useState<{ code: string; discount_rate: number } | null>(null);
  const [couponLoading, setCouponLoading]   = useState(false);
  const [buying, setBuying]                 = useState(false);

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

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    try {
      const result = await orderService.validateCoupon(code);
      setCouponData({ code: result.code, discount_rate: Number(result.discount_rate) });
      toast.success(`Kupon uygulandı! %${result.discount_rate} indirim`);
    } catch {
      toast.error("Geçersiz veya süresi dolmuş kupon.");
      setCouponData(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const basePrice   = artwork ? Number(artwork.price) : 0;
  const discountAmt = couponData ? Math.round(basePrice * couponData.discount_rate / 100) : 0;
  const finalPrice  = basePrice - discountAmt;

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) { toast.error("Teslimat adresi giriniz."); return; }
    setBuying(true);
    try {
      const order = await orderService.create({
        items: [{ artwork: Number(id), quantity: 1 }],
        payment_method: payMethod,
        shipping_address: address,
        coupon_code: couponData?.code,
      });
      await orderService.pay(order.id, payMethod);
      toast.success("Satın alma başarılı!");
      setShowBuyModal(false);
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

  if (!artwork) return <div style={s.loading}>Yükleniyor...</div>;

  return (
    <div style={s.page}>
      <div style={s.top}>
        {/* Sol: Görsel */}
        <div style={s.imgSection}>
          {artwork.primary_image
            ? <img src={artwork.primary_image} alt={artwork.title} style={s.img} />
            : <div style={s.noImg}>🖼️</div>}
        </div>

        {/* Sağ: Bilgiler */}
        <div style={s.info}>
          <h1 style={s.title}>{artwork.title}</h1>
          <p style={s.artist}>{artwork.artist_name}</p>

          {artwork.avg_rating && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <StarRating rating={Math.round(artwork.avg_rating)} size={20} />
              <span style={{ color: "#666", fontSize: 13 }}>
                {artwork.avg_rating} ({artwork.review_count} yorum)
              </span>
            </div>
          )}

          <p style={s.desc}>{artwork.description}</p>

          <div style={s.meta}>
            {artwork.medium     && <span>{artwork.medium}</span>}
            {artwork.dimensions && <span>{artwork.dimensions}</span>}
            <span>{artwork.view_count} görüntülenme</span>
          </div>

          <div style={s.priceRow}>
            <span style={s.price}>₺{Number(artwork.price).toLocaleString()}</span>
            <span style={{ ...s.statusBadge, background: artwork.status === "available" ? "#27ae60" : "#e74c3c" }}>
              {artwork.status === "available" ? "Satışta" : "Satışa Kapalı"}
            </span>
          </div>

          {artwork.status === "available" && (
            <button
              style={s.buyBtn}
              onClick={() => { if (!isAuthenticated) { navigate("/login"); return; } setShowBuyModal(true); }}
            >
              Satın Al
            </button>
          )}

          <button
            style={{ ...s.favBtn, background: artwork.is_favorited ? "#ffeef0" : "#f5f5f5" }}
            onClick={handleFavorite}
          >
            {artwork.is_favorited ? "Favorilerde" : "Favorilere Ekle"}
          </button>
        </div>
      </div>

      {/* ── SATIN ALMA MODAL ── */}
      {showBuyModal && (
        <div style={s.overlay} onClick={() => setShowBuyModal(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>Satın Al</h2>
              <button style={s.closeBtn} onClick={() => setShowBuyModal(false)}>✕</button>
            </div>

            {/* Eser özeti */}
            <div style={s.artworkRow}>
              {artwork.primary_image && (
                <img src={artwork.primary_image} alt={artwork.title} style={s.thumb} />
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>{artwork.title}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{artwork.artist_name}</div>
              </div>
            </div>

            <form onSubmit={handleBuy} style={s.form}>
              {/* Teslimat adresi */}
              <div>
                <label style={s.label}>Teslimat Adresi *</label>
                <textarea
                  style={s.textarea}
                  rows={3}
                  placeholder="Mahalle, cadde, no, ilçe, şehir"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

              {/* Ödeme yöntemi */}
              <div>
                <label style={s.label}>Ödeme Yöntemi</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {PAYMENT_METHODS.map((m) => (
                    <label
                      key={m.value}
                      style={{
                        ...s.payOption,
                        borderColor: payMethod === m.value ? "#e94560" : "#ddd",
                        background:  payMethod === m.value ? "#fff5f7" : "#fff",
                      }}
                    >
                      <input
                        type="radio"
                        name="pay"
                        value={m.value}
                        checked={payMethod === m.value}
                        onChange={() => setPayMethod(m.value)}
                        style={{ marginRight: 8 }}
                      />
                      {m.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Kupon */}
              <div>
                <label style={s.label}>İndirim Kuponu <span style={{ fontWeight: 400, color: "#aaa" }}>(opsiyonel)</span></label>
                {couponData ? (
                  <div style={s.couponApplied}>
                    <span><strong>{couponData.code}</strong> — %{couponData.discount_rate} indirim</span>
                    <button type="button" style={s.removeCoupon}
                      onClick={() => { setCouponData(null); setCouponInput(""); }}>
                      Kaldır
                    </button>
                  </div>
                ) : (
                  <div style={s.couponRow}>
                    <input
                      style={s.couponInput}
                      placeholder="Örn: SANAT15"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleApplyCoupon(); } }}
                    />
                    <button type="button" style={s.couponBtn} onClick={handleApplyCoupon} disabled={couponLoading}>
                      {couponLoading ? "..." : "Uygula"}
                    </button>
                  </div>
                )}
              </div>

              {/* Fiyat özeti */}
              <div style={s.priceBox}>
                <div style={s.priceLine}>
                  <span>Eser fiyatı</span>
                  <span>₺{basePrice.toLocaleString()}</span>
                </div>
                {discountAmt > 0 && (
                  <div style={{ ...s.priceLine, color: "#27ae60" }}>
                    <span>İndirim (%{couponData?.discount_rate})</span>
                    <span>−₺{discountAmt.toLocaleString()}</span>
                  </div>
                )}
                <div style={s.priceFinal}>
                  <span>Ödenecek</span>
                  <span style={{ color: "#e94560" }}>₺{finalPrice.toLocaleString()}</span>
                </div>
              </div>

              <button style={s.confirmBtn} type="submit" disabled={buying}>
                {buying ? "İşleniyor..." : `₺${finalPrice.toLocaleString()} Öde`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── YORUMLAR ── */}
      <div style={s.reviewSection}>
        <div style={s.reviewHeader}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Yorumlar</h2>
          <select style={s.select} value={reviewOrdering} onChange={(e) => setReviewOrdering(e.target.value)}>
            <option value="-created_at">En Yeni</option>
            <option value="-rating">En Yüksek Puan</option>
            <option value="-helpful_count">En Faydalı</option>
          </select>
        </div>

        {isAuthenticated && (
          <form onSubmit={handleReview} style={s.reviewForm}>
            <div>
              <label style={s.label}>Puanınız</label>
              <StarRating rating={newRating} interactive onChange={setNewRating} size={28} />
            </div>
            <textarea
              style={s.textarea}
              placeholder="Yorumunuzu yazın..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              required
              rows={3}
            />
            <button style={s.submitBtn} type="submit">Yorum Ekle</button>
          </form>
        )}

        {reviews.length === 0 ? (
          <p style={{ color: "#999", textAlign: "center", padding: 20 }}>Henüz yorum yok.</p>
        ) : reviews.map((r) => (
          <div key={r.id} style={s.reviewCard}>
            <div style={s.reviewTop}>
              <strong>{r.user_name}</strong>
              <StarRating rating={r.rating} />
              {r.is_verified_purchase && <span style={s.verified}>Doğrulanmış Alım</span>}
              <span style={s.date}>{new Date(r.created_at).toLocaleDateString("tr-TR")}</span>
            </div>
            <p style={s.reviewText}>{r.comment}</p>
            {r.reply && (
              <div style={s.reply}>
                <strong>Galeri Yanıtı:</strong> {r.reply.reply_text}
              </div>
            )}
            <button style={s.helpfulBtn} onClick={() => handleVote(r.id)}>
              Faydalı ({r.helpful_count})
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page:        { maxWidth: 1100, margin: "0 auto", padding: "24px 16px" },
  loading:     { textAlign: "center", padding: 80, fontSize: 18, color: "#999" },
  top:         { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, marginBottom: 40 },
  imgSection:  { borderRadius: 12, overflow: "hidden", background: "#f5f5f5", minHeight: 400 },
  img:         { width: "100%", height: "100%", objectFit: "cover" },
  noImg:       { display: "flex", alignItems: "center", justifyContent: "center", height: 400, fontSize: 80 },
  info:        { display: "flex", flexDirection: "column", gap: 12 },
  title:       { fontSize: 28, color: "#1a1a2e", margin: 0 },
  artist:      { fontSize: 15, color: "#666" },
  desc:        { fontSize: 14, color: "#444", lineHeight: 1.6 },
  meta:        { display: "flex", gap: 16, fontSize: 13, color: "#888", flexWrap: "wrap" },
  priceRow:    { display: "flex", alignItems: "center", gap: 16 },
  price:       { fontSize: 28, fontWeight: 700, color: "#e94560" },
  statusBadge: { color: "#fff", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600 },
  buyBtn:      { padding: "12px 24px", background: "#e94560", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, cursor: "pointer", fontWeight: 600 },
  favBtn:      { padding: "10px 20px", border: "1px solid #ddd", borderRadius: 8, cursor: "pointer", fontSize: 14 },

  // Modal
  overlay:     { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 16 },
  modal:       { background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle:  { fontSize: 20, fontWeight: 700, color: "#1a1a2e", margin: 0 },
  closeBtn:    { background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#aaa", padding: "4px 8px" },
  artworkRow:  { display: "flex", gap: 12, alignItems: "center", background: "#f9f9f9", borderRadius: 10, padding: 12, marginBottom: 20 },
  thumb:       { width: 60, height: 60, borderRadius: 8, objectFit: "cover" },

  form:        { display: "flex", flexDirection: "column", gap: 16 },
  label:       { fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 },
  textarea:    { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, resize: "vertical", boxSizing: "border-box" as const },
  payOption:   { display: "flex", alignItems: "center", padding: "10px 14px", border: "2px solid #ddd", borderRadius: 8, cursor: "pointer", fontSize: 14 },

  couponRow:     { display: "flex", gap: 8 },
  couponInput:   { flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, letterSpacing: 1 },
  couponBtn:     { padding: "10px 16px", background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 },
  couponApplied: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#eafaf1", border: "1px solid #a9dfbf", borderRadius: 8, padding: "10px 14px", fontSize: 14 },
  removeCoupon:  { background: "none", border: "none", color: "#e74c3c", cursor: "pointer", fontSize: 13, fontWeight: 600 },

  priceBox:   { background: "#f9f9f9", borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 },
  priceLine:  { display: "flex", justifyContent: "space-between", fontSize: 14, color: "#555" },
  priceFinal: { display: "flex", justifyContent: "space-between", fontSize: 17, fontWeight: 700, paddingTop: 8, borderTop: "1px solid #e0e0e0" },
  confirmBtn: { padding: "14px", background: "#e94560", color: "#fff", border: "none", borderRadius: 10, fontSize: 16, cursor: "pointer", fontWeight: 700 },

  // Yorumlar
  select:        { padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14 },
  reviewSection: { borderTop: "2px solid #f0f0f0", paddingTop: 32 },
  reviewHeader:  { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  reviewForm:    { background: "#f9f9f9", padding: 20, borderRadius: 10, marginBottom: 20, display: "flex", flexDirection: "column", gap: 12 },
  submitBtn:     { alignSelf: "flex-start", padding: "10px 24px", background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 },
  reviewCard:    { background: "#fff", border: "1px solid #eee", borderRadius: 10, padding: 16, marginBottom: 12 },
  reviewTop:     { display: "flex", gap: 12, alignItems: "center", marginBottom: 8, flexWrap: "wrap" },
  verified:      { fontSize: 12, color: "#27ae60", background: "#eafaf1", padding: "2px 8px", borderRadius: 10 },
  date:          { fontSize: 12, color: "#aaa", marginLeft: "auto" },
  reviewText:    { fontSize: 14, color: "#444", lineHeight: 1.6 },
  reply:         { background: "#f0f4ff", padding: "10px 14px", borderRadius: 8, fontSize: 13, color: "#333", marginTop: 8 },
  helpfulBtn:    { background: "none", border: "1px solid #ddd", borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 12, marginTop: 8, color: "#666" },
};
