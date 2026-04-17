import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { eventService } from "../services/eventService";
import { reservationService } from "../services/reservationService";
import { reviewService } from "../services/reviewService";
import { useAuthStore } from "../store/authStore";
import type { Event, Review } from "../types";
import StarRating from "../components/StarRating";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [event, setEvent] = useState<Event | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [participants, setParticipants] = useState(1);
  const [notes, setNotes] = useState("");
  const [reserving, setReserving] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (!id) return;
    eventService.detail(Number(id)).then(setEvent).catch(() => toast.error("Etkinlik bulunamadı."));
    loadReviews();
  }, [id]);

  const loadReviews = async () => {
    const data = await reviewService.getEventReviews(Number(id));
    setReviews(data.results ?? data);
  };

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate("/login"); return; }
    setReserving(true);
    try {
      await reservationService.create({ event: Number(id), participant_count: participants, notes });
      toast.success("Rezervasyon oluşturuldu! 🎉");
      navigate("/reservations");
    } catch (err: any) {
      toast.error(err.response?.data?.non_field_errors?.[0] || "Rezervasyon başarısız.");
    } finally {
      setReserving(false);
    }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate("/login"); return; }
    try {
      await reviewService.createEventReview({ event: Number(id), rating: newRating, comment: newComment });
      toast.success("Yorumunuz eklendi!");
      setNewComment("");
      loadReviews();
    } catch (err: any) {
      toast.error(err.response?.data?.non_field_errors?.[0] || "Yorum eklenemedi.");
    }
  };

  if (!event) return <div style={styles.loading}>Yükleniyor...</div>;

  const full = event.available_slots === 0;

  return (
    <div style={styles.page}>
      <div style={styles.top}>
        <div style={styles.imgSection}>
          {event.image ? (
            <img src={event.image} alt={event.title} style={styles.img} />
          ) : (
            <div style={styles.noImg}>🎭</div>
          )}
        </div>

        <div style={styles.info}>
          <h1 style={styles.title}>{event.title}</h1>
          <p style={styles.meta}>📍 {event.location}</p>
          <p style={styles.meta}>
            📅 Başlangıç: {new Date(event.start_datetime).toLocaleString("tr-TR")}
          </p>
          <p style={styles.meta}>
            🏁 Bitiş: {new Date(event.end_datetime).toLocaleString("tr-TR")}
          </p>
          <p style={styles.meta}>👥 Kontenjan: {event.capacity} kişi</p>
          <p style={styles.meta}>
            🟢 Mevcut: {full ? <span style={{ color: "#e74c3c" }}>Dolu</span> : `${event.available_slots} kişi`}
          </p>
          {event.avg_rating && (
            <div>
              <StarRating rating={Math.round(event.avg_rating)} size={20} />
              <span style={{ marginLeft: 8, color: "#666", fontSize: 13 }}>
                {event.avg_rating} ({event.review_count} yorum)
              </span>
            </div>
          )}
          <p style={styles.desc}>{event.description}</p>
          <span style={styles.price}>₺{Number(event.price).toLocaleString()}</span>

          {/* Rezervasyon formu */}
          {!full && event.status === "upcoming" && (
            <form onSubmit={handleReserve} style={styles.reserveForm}>
              <h3 style={{ margin: "0 0 12px" }}>📋 Rezervasyon Yap</h3>
              <label style={styles.label}>Katılımcı Sayısı</label>
              <input
                style={styles.input}
                type="number"
                min={1}
                max={event.available_slots}
                value={participants}
                onChange={(e) => setParticipants(Number(e.target.value))}
              />
              <label style={styles.label}>Notlar (opsiyonel)</label>
              <textarea
                style={styles.textarea}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Özel istekleriniz..."
              />
              <div style={styles.totalRow}>
                <span>Toplam:</span>
                <strong style={{ color: "#e94560" }}>
                  ₺{(Number(event.price) * participants).toLocaleString()}
                </strong>
              </div>
              <button style={styles.reserveBtn} type="submit" disabled={reserving}>
                {reserving ? "İşleniyor..." : "Rezervasyon Yap"}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Yorumlar */}
      <div style={styles.reviewSection}>
        <h2>💬 Yorumlar</h2>
        {isAuthenticated && (
          <form onSubmit={handleReview} style={styles.reviewForm}>
            <p style={{ fontSize: 13, color: "#888", margin: "0 0 8px" }}>
              ⚠️ Yorum yapabilmek için etkinliğe katılmış olmanız gerekir.
            </p>
            <StarRating rating={newRating} interactive onChange={setNewRating} size={28} />
            <textarea
              style={styles.textarea}
              placeholder="Etkinlik hakkında yorumunuz..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              required rows={3}
            />
            <button style={styles.submitBtn} type="submit">Yorum Ekle</button>
          </form>
        )}
        {reviews.map((r) => (
          <div key={r.id} style={styles.reviewCard}>
            <div style={styles.reviewTop}>
              <strong>{r.user_name}</strong>
              <StarRating rating={r.rating} />
              <span style={styles.date}>{new Date(r.created_at).toLocaleDateString("tr-TR")}</span>
            </div>
            <p style={styles.reviewText}>{r.comment}</p>
            {r.reply && (
              <div style={styles.reply}>
                <strong>Galeri Yanıtı:</strong> {r.reply.reply_text}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 1100, margin: "0 auto", padding: "24px 16px" },
  loading: { textAlign: "center", padding: 80, fontSize: 18, color: "#999" },
  top: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, marginBottom: 40 },
  imgSection: { borderRadius: 12, overflow: "hidden", background: "#f5f5f5", minHeight: 360 },
  img: { width: "100%", height: "100%", objectFit: "cover" },
  noImg: { display: "flex", alignItems: "center", justifyContent: "center", height: 360, fontSize: 80 },
  info: { display: "flex", flexDirection: "column", gap: 10 },
  title: { fontSize: 26, color: "#1a1a2e", margin: 0 },
  meta: { fontSize: 14, color: "#555", margin: 0 },
  desc: { fontSize: 14, color: "#444", lineHeight: 1.6 },
  price: { fontSize: 26, fontWeight: 700, color: "#e94560" },
  reserveForm: { background: "#f9f9f9", padding: 20, borderRadius: 10, display: "flex", flexDirection: "column", gap: 10, marginTop: 8 },
  label: { fontSize: 13, fontWeight: 600, color: "#555" },
  input: { padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14 },
  textarea: { padding: 10, borderRadius: 8, border: "1px solid #ddd", fontSize: 14, resize: "vertical" },
  totalRow: { display: "flex", justifyContent: "space-between", fontSize: 16 },
  reserveBtn: { padding: "12px", background: "#e94560", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, cursor: "pointer", fontWeight: 600 },
  reviewSection: { borderTop: "2px solid #f0f0f0", paddingTop: 32 },
  reviewForm: { background: "#f9f9f9", padding: 20, borderRadius: 10, marginBottom: 20, display: "flex", flexDirection: "column", gap: 12 },
  submitBtn: { alignSelf: "flex-start", padding: "10px 24px", background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 },
  reviewCard: { background: "#fff", border: "1px solid #eee", borderRadius: 10, padding: 16, marginBottom: 12 },
  reviewTop: { display: "flex", gap: 12, alignItems: "center", marginBottom: 8, flexWrap: "wrap" },
  date: { fontSize: 12, color: "#aaa", marginLeft: "auto" },
  reviewText: { fontSize: 14, color: "#444", lineHeight: 1.6 },
  reply: { background: "#f0f4ff", padding: "10px 14px", borderRadius: 8, fontSize: 13, color: "#333", marginTop: 8 },
};
