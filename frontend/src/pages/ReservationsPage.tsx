import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { reservationService } from "../services/reservationService";
import type { Reservation } from "../types";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Beklemede", color: "#f39c12" },
  confirmed: { label: "Onaylandı", color: "#27ae60" },
  cancelled: { label: "İptal Edildi", color: "#e74c3c" },
  completed: { label: "Tamamlandı", color: "#3498db" },
  no_show: { label: "Gelmedi", color: "#95a5a6" },
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [editCount, setEditCount] = useState(1);
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data: Reservation[] | { results: Reservation[] } = await reservationService.list();
      setReservations(Array.isArray(data) ? data : (data as { results: Reservation[] }).results);
    } catch {
      toast.error("Rezervasyonlar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleUpdate = async (id: number) => {
    try {
      await reservationService.update(id, { participant_count: editCount });
      toast.success("Rezervasyon güncellendi!");
      setEditId(null);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.participant_count?.[0] || "Güncelleme başarısız.");
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await reservationService.cancel(id, cancelReason);
      toast.success("Rezervasyon iptal edildi.");
      setCancelId(null);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "İptal başarısız.");
    }
  };

  if (loading) return <div style={styles.loading}>Yükleniyor...</div>;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>📋 Rezervasyonlarım</h1>

      {reservations.length === 0 ? (
        <div style={styles.empty}>Henüz rezervasyonunuz yok.</div>
      ) : (
        <div style={styles.list}>
          {reservations.map((r) => {
            const st = STATUS_LABELS[r.status] || { label: r.status, color: "#999" };
            return (
              <div key={r.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <h3 style={styles.eventTitle}>{r.event_title}</h3>
                    <p style={styles.meta}>📍 {r.event_location}</p>
                    <p style={styles.meta}>
                      📅 {new Date(r.event_date).toLocaleString("tr-TR")}
                    </p>
                  </div>
                  <span style={{ ...styles.badge, background: st.color }}>{st.label}</span>
                </div>

                <div style={styles.details}>
                  <span>👥 {r.participant_count} katılımcı</span>
                  <span>💰 ₺{Number(r.total_price).toLocaleString()}</span>
                  <span style={styles.date}>
                    {new Date(r.reserved_at).toLocaleDateString("tr-TR")}
                  </span>
                </div>

                {/* Güncelleme formu */}
                {editId === r.id ? (
                  <div style={styles.editForm}>
                    <label style={styles.label}>Katılımcı Sayısı</label>
                    <input
                      style={styles.input}
                      type="number"
                      min={1}
                      value={editCount}
                      onChange={(e) => setEditCount(Number(e.target.value))}
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={styles.saveBtn} onClick={() => handleUpdate(r.id)}>Kaydet</button>
                      <button style={styles.cancelEditBtn} onClick={() => setEditId(null)}>Vazgeç</button>
                    </div>
                  </div>
                ) : cancelId === r.id ? (
                  <div style={styles.editForm}>
                    <label style={styles.label}>İptal Nedeni (opsiyonel)</label>
                    <input
                      style={styles.input}
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Neden iptal ediyorsunuz?"
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={styles.dangerBtn} onClick={() => handleCancel(r.id)}>İptal Et</button>
                      <button style={styles.cancelEditBtn} onClick={() => setCancelId(null)}>Vazgeç</button>
                    </div>
                  </div>
                ) : (
                  r.status === "pending" || r.status === "confirmed" ? (
                    <div style={styles.actions}>
                      <button style={styles.editBtn} onClick={() => { setEditId(r.id); setEditCount(r.participant_count); }}>
                        ✏️ Güncelle
                      </button>
                      <button style={styles.dangerBtn} onClick={() => setCancelId(r.id)}>
                        ❌ İptal Et
                      </button>
                    </div>
                  ) : null
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 800, margin: "0 auto", padding: "24px 16px" },
  title: { fontSize: 28, color: "#1a1a2e", marginBottom: 20 },
  loading: { textAlign: "center", padding: 80, fontSize: 18, color: "#999" },
  empty: { textAlign: "center", padding: 60, color: "#999", fontSize: 16 },
  list: { display: "flex", flexDirection: "column", gap: 16 },
  card: { background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  eventTitle: { fontSize: 18, fontWeight: 700, color: "#1a1a2e", margin: "0 0 4px" },
  meta: { fontSize: 13, color: "#666", margin: "2px 0" },
  badge: { color: "#fff", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" },
  details: { display: "flex", gap: 20, fontSize: 14, color: "#555", borderTop: "1px solid #f0f0f0", paddingTop: 12, flexWrap: "wrap" },
  date: { marginLeft: "auto", color: "#aaa", fontSize: 12 },
  actions: { display: "flex", gap: 10, marginTop: 12 },
  editBtn: { padding: "8px 16px", background: "#f0f4ff", color: "#1a1a2e", border: "1px solid #c5d5ff", borderRadius: 8, cursor: "pointer", fontSize: 13 },
  dangerBtn: { padding: "8px 16px", background: "#fff0f0", color: "#e74c3c", border: "1px solid #ffc5c5", borderRadius: 8, cursor: "pointer", fontSize: 13 },
  editForm: { marginTop: 12, display: "flex", flexDirection: "column", gap: 8, background: "#f9f9f9", padding: 16, borderRadius: 8 },
  label: { fontSize: 13, fontWeight: 600, color: "#555" },
  input: { padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14 },
  saveBtn: { padding: "8px 20px", background: "#27ae60", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 },
  cancelEditBtn: { padding: "8px 16px", background: "#eee", color: "#555", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 },
};
