import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminService } from "../../services/adminService";

const STATUS_COLORS: Record<string, string> = {
  upcoming: "#3498db", ongoing: "#27ae60", completed: "#95a5a6", cancelled: "#e74c3c",
};
const STATUS_LABELS: Record<string, string> = {
  upcoming: "Yaklaşan", ongoing: "Devam Ediyor", completed: "Tamamlandı", cancelled: "İptal",
};
const TYPE_LABELS: Record<string, string> = {
  workshop: "Atölye", exhibition: "Sergi", seminar: "Seminer", tour: "Tur", other: "Diğer",
};
const RES_STATUS_COLORS: Record<string, string> = {
  pending: "#f39c12", confirmed: "#27ae60", cancelled: "#e74c3c", completed: "#3498db", no_show: "#95a5a6",
};
const RES_STATUS_LABELS: Record<string, string> = {
  pending: "Beklemede", confirmed: "Onaylandı", cancelled: "İptal", completed: "Tamamlandı", no_show: "Gelmedi",
};

const EMPTY_FORM = {
  title: "", description: "", event_type: "workshop", category_id: "",
  location: "", start_datetime: "", end_datetime: "",
  capacity: "", price: "", status: "upcoming",
};

export default function AdminEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"events" | "reservations">("events");

  // Rezervasyon paneli
  const [reservations, setReservations] = useState<any[]>([]);
  const [resLoading, setResLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState<any | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const [evData, catData] = await Promise.all([
        adminService.getEvents({ ordering: "start_datetime" }),
        adminService.getEventCategories(),
      ]);
      setEvents(evData.results ?? evData);
      setCategories(catData.results ?? catData);
    } catch {
      toast.error("Etkinlikler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  const loadReservations = async (eventId?: number) => {
    setResLoading(true);
    try {
      const params: Record<string, string> = {};
      if (eventId) params.event = String(eventId);
      const data = await adminService.getAllReservations(params);
      setReservations(data.results ?? data);
    } catch {
      toast.error("Rezervasyonlar yüklenemedi.");
    } finally {
      setResLoading(false);
    }
  };

  useEffect(() => { loadEvents(); }, []);

  useEffect(() => {
    if (tab === "reservations") loadReservations(selectedEvent?.id);
  }, [tab, selectedEvent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = { ...form };
      if (payload.category_id) payload.category_id = Number(payload.category_id);
      else delete payload.category_id;
      payload.capacity = Number(payload.capacity);
      payload.price = Number(payload.price);

      if (editEvent) {
        await adminService.updateEvent(editEvent.id, payload);
        toast.success("Etkinlik güncellendi.");
      } else {
        await adminService.createEvent(payload);
        toast.success("Etkinlik oluşturuldu.");
      }
      setShowForm(false);
      setEditEvent(null);
      setForm({ ...EMPTY_FORM });
      loadEvents();
    } catch (err: any) {
      const errors = err.response?.data;
      toast.error(errors ? Object.values(errors).flat().join(" ") : "İşlem başarısız.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bu etkinliği silmek istediğinizden emin misiniz?")) return;
    try {
      await adminService.deleteEvent(id);
      toast.success("Etkinlik silindi.");
      loadEvents();
    } catch {
      toast.error("Silinemedi.");
    }
  };

  const handleConfirmRes = async (id: number) => {
    try {
      await adminService.confirmReservation(id);
      toast.success("Rezervasyon onaylandı.");
      loadReservations(selectedEvent?.id);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "İşlem başarısız.");
    }
  };

  const handleCancelRes = async (id: number) => {
    try {
      await adminService.cancelReservation(id);
      toast.success("Rezervasyon iptal edildi.");
      loadReservations(selectedEvent?.id);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "İşlem başarısız.");
    }
  };

  // Datetime-local input için format
  const toDatetimeLocal = (iso: string) => iso ? iso.slice(0, 16) : "";

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>Etkinlik Yönetimi</h1>
        <button style={s.addBtn} onClick={() => { setShowForm(true); setEditEvent(null); setForm({ ...EMPTY_FORM }); }}>
          Yeni Etkinlik
        </button>
      </div>

      {/* Sekmeler */}
      <div style={s.tabs}>
        <button style={{ ...s.tab, ...(tab === "events" ? s.activeTab : {}) }} onClick={() => setTab("events")}>
          Etkinlikler ({events.length})
        </button>
        <button style={{ ...s.tab, ...(tab === "reservations" ? s.activeTab : {}) }} onClick={() => setTab("reservations")}>
          Rezervasyonlar
        </button>
      </div>

      {/* ── ETKİNLİKLER ── */}
      {tab === "events" && (
        loading ? <div style={s.loading}>Yükleniyor...</div> : (
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  <th style={s.th}>Etkinlik</th>
                  <th style={s.th}>Tür</th>
                  <th style={s.th}>Tarih</th>
                  <th style={s.th}>Yer</th>
                  <th style={s.th}>Doluluk</th>
                  <th style={s.th}>Fiyat</th>
                  <th style={s.th}>Durum</th>
                  <th style={s.th}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => {
                  const filled = ev.capacity - (ev.available_slots ?? ev.capacity);
                  const pct = ev.capacity > 0 ? Math.round((filled / ev.capacity) * 100) : 0;
                  return (
                    <tr key={ev.id} style={s.tr}>
                      <td style={s.td}>
                        <div style={s.eventName}>{ev.title}</div>
                        <div style={s.eventOrg}>
                          {ev.organizer_name || ev.organizer || "—"}
                        </div>
                      </td>
                      <td style={s.td}>{TYPE_LABELS[ev.event_type] || ev.event_type}</td>
                      <td style={s.td}>
                        <div>{new Date(ev.start_datetime).toLocaleDateString("tr-TR")}</div>
                        <div style={{ fontSize: 11, color: "#aaa" }}>
                          {new Date(ev.start_datetime).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>
                      <td style={{ ...s.td, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.location}</td>
                      <td style={s.td}>
                        <div style={s.capacityBar}>
                          <div style={{ ...s.capacityFill, width: `${pct}%`, background: pct >= 90 ? "#e74c3c" : pct >= 60 ? "#f39c12" : "#27ae60" }} />
                        </div>
                        <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{filled}/{ev.capacity} (%{pct})</div>
                      </td>
                      <td style={s.td}>₺{Number(ev.price).toLocaleString()}</td>
                      <td style={s.td}>
                        <span style={{ ...s.badge, background: STATUS_COLORS[ev.status] }}>
                          {STATUS_LABELS[ev.status] || ev.status}
                        </span>
                      </td>
                      <td style={s.td}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button style={s.resBtn} onClick={() => { setSelectedEvent(ev); setTab("reservations"); }}>
                            Rezervasyonlar
                          </button>
                          <button style={s.editBtn} onClick={() => {
                            setEditEvent(ev);
                            setForm({
                              title: ev.title, description: ev.description,
                              event_type: ev.event_type,
                              category_id: ev.category?.id || ev.category_id || "",
                              location: ev.location,
                              start_datetime: toDatetimeLocal(ev.start_datetime),
                              end_datetime: toDatetimeLocal(ev.end_datetime),
                              capacity: String(ev.capacity), price: String(ev.price),
                              status: ev.status,
                            });
                            setShowForm(true);
                          }}>Düzenle</button>
                          <button style={s.deleteBtn} onClick={() => handleDelete(ev.id)}>Sil</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ── REZERVASYONLAR ── */}
      {tab === "reservations" && (
        <div>
          {/* Etkinlik filtresi */}
          <div style={s.resFilter}>
            <select
              style={s.select}
              value={selectedEvent?.id || ""}
              onChange={(e) => {
                const ev = events.find((x) => x.id === Number(e.target.value)) || null;
                setSelectedEvent(ev);
              }}
            >
              <option value="">Tüm Etkinlikler</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.title}</option>
              ))}
            </select>
            {selectedEvent && (
              <div style={s.resEventInfo}>
                <strong>{selectedEvent.title}</strong>
                <span style={{ color: "#888", fontSize: 13 }}>
                  {" "}— {selectedEvent.capacity - (selectedEvent.available_slots ?? 0)}/{selectedEvent.capacity} kişi
                </span>
              </div>
            )}
          </div>

          {resLoading ? <div style={s.loading}>Yükleniyor...</div> : (
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr style={s.thead}>
                    <th style={s.th}>#</th>
                    <th style={s.th}>Kullanıcı</th>
                    <th style={s.th}>Etkinlik</th>
                    <th style={s.th}>Katılımcı</th>
                    <th style={s.th}>Tutar</th>
                    <th style={s.th}>Tarih</th>
                    <th style={s.th}>Durum</th>
                    <th style={s.th}>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "#aaa" }}>Rezervasyon bulunamadı.</td></tr>
                  ) : reservations.map((r) => (
                    <tr key={r.id} style={s.tr}>
                      <td style={s.td}>#{r.id}</td>
                      <td style={s.td}>
                        <div style={{ fontWeight: 600 }}>{r.user_name || r.user}</div>
                        <div style={{ fontSize: 11, color: "#aaa" }}>{r.user_email}</div>
                      </td>
                      <td style={{ ...s.td, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.event_title || r.event}
                      </td>
                      <td style={s.td}>{r.participant_count} kişi</td>
                      <td style={s.td}>₺{Number(r.total_price || 0).toLocaleString()}</td>
                      <td style={s.td}>{new Date(r.reserved_at).toLocaleDateString("tr-TR")}</td>
                      <td style={s.td}>
                        <span style={{ ...s.badge, background: RES_STATUS_COLORS[r.status] }}>
                          {RES_STATUS_LABELS[r.status] || r.status}
                        </span>
                      </td>
                      <td style={s.td}>
                        <div style={{ display: "flex", gap: 6 }}>
                          {r.status === "pending" && (
                            <button style={s.confirmBtn} onClick={() => handleConfirmRes(r.id)}>✓ Onayla</button>
                          )}
                          {(r.status === "pending" || r.status === "confirmed") && (
                            <button style={s.cancelResBtn} onClick={() => handleCancelRes(r.id)}>✕ İptal</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── ETKİNLİK FORM MODAL ── */}
      {showForm && (
        <div style={s.overlay} onClick={() => setShowForm(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={s.modalTitle}>{editEvent ? "Etkinliği Düzenle" : "Yeni Etkinlik Ekle"}</h2>
            <form onSubmit={handleSubmit} style={s.form}>
              <div style={s.formGrid}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={s.label}>Etkinlik Adı *</label>
                  <input style={s.input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                </div>

                <div>
                  <label style={s.label}>Tür *</label>
                  <select style={s.input} value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })}>
                    <option value="workshop">Atölye</option>
                    <option value="exhibition">Sergi</option>
                    <option value="seminar">Seminer</option>
                    <option value="tour">Tur</option>
                    <option value="other">Diğer</option>
                  </select>
                </div>

                <div>
                  <label style={s.label}>Kategori</label>
                  <select style={s.input} value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                    <option value="">Seçin (opsiyonel)</option>
                    {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={s.label}>Yer *</label>
                  <input style={s.input} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required placeholder="Örn: Galeri Ana Salon, İstanbul" />
                </div>

                <div>
                  <label style={s.label}>Başlangıç *</label>
                  <input style={s.input} type="datetime-local" value={form.start_datetime} onChange={(e) => setForm({ ...form, start_datetime: e.target.value })} required />
                </div>

                <div>
                  <label style={s.label}>Bitiş *</label>
                  <input style={s.input} type="datetime-local" value={form.end_datetime} onChange={(e) => setForm({ ...form, end_datetime: e.target.value })} required />
                </div>

                <div>
                  <label style={s.label}>Kapasite (kişi) *</label>
                  <input style={s.input} type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} required />
                </div>

                <div>
                  <label style={s.label}>Fiyat (₺) *</label>
                  <input style={s.input} type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                </div>

                <div>
                  <label style={s.label}>Durum</label>
                  <select style={s.input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="upcoming">Yaklaşan</option>
                    <option value="ongoing">Devam Ediyor</option>
                    <option value="completed">Tamamlandı</option>
                    <option value="cancelled">İptal</option>
                  </select>
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={s.label}>Açıklama *</label>
                  <textarea style={{ ...s.input, resize: "vertical" }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} required />
                </div>
              </div>

              <div style={s.formActions}>
                <button style={s.saveBtn} type="submit" disabled={saving}>
                  {saving ? "Kaydediliyor..." : editEvent ? "Güncelle" : "Oluştur"}
                </button>
                <button style={s.cancelBtn} type="button" onClick={() => setShowForm(false)}>İptal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: 1200, margin: "0 auto", padding: "24px 16px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 28, color: "#1a1a2e", margin: 0, fontWeight: 800 },
  addBtn: { padding: "10px 20px", background: "#e94560", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 },
  tabs: { display: "flex", borderBottom: "2px solid #f0f0f0", marginBottom: 20 },
  tab: { padding: "12px 24px", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#888" },
  activeTab: { color: "#e94560", borderBottom: "2px solid #e94560", fontWeight: 700 },
  loading: { textAlign: "center", padding: 60, color: "#999" },
  tableWrap: { background: "#fff", borderRadius: 12, overflow: "auto", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 800 },
  thead: { background: "#f8f9fa" },
  th: { padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" },
  tr: { borderBottom: "1px solid #f5f5f5" },
  td: { padding: "12px 16px", fontSize: 14, color: "#333", verticalAlign: "middle" },
  eventName: { fontWeight: 700, color: "#1a1a2e", marginBottom: 2 },
  eventOrg: { fontSize: 11, color: "#aaa" },
  capacityBar: { height: 6, background: "#eee", borderRadius: 3, overflow: "hidden", width: 80 },
  capacityFill: { height: "100%", borderRadius: 3 },
  badge: { color: "#fff", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" },
  resBtn: { padding: "5px 8px", background: "#f0f4ff", border: "1px solid #c5d5ff", borderRadius: 6, cursor: "pointer", fontSize: 13 },
  editBtn: { padding: "5px 8px", background: "#fff9e6", border: "1px solid #ffe0a0", borderRadius: 6, cursor: "pointer", fontSize: 13 },
  deleteBtn: { padding: "5px 8px", background: "#fff0f0", border: "1px solid #ffc5c5", borderRadius: 6, cursor: "pointer", fontSize: 13 },
  confirmBtn: { padding: "5px 10px", background: "#eafaf1", border: "1px solid #a9dfbf", borderRadius: 6, cursor: "pointer", fontSize: 12, color: "#27ae60", fontWeight: 600 },
  cancelResBtn: { padding: "5px 10px", background: "#fff0f0", border: "1px solid #ffc5c5", borderRadius: 6, cursor: "pointer", fontSize: 12, color: "#e74c3c", fontWeight: 600 },
  resFilter: { display: "flex", alignItems: "center", gap: 16, marginBottom: 16 },
  select: { padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, background: "#fff" },
  resEventInfo: { fontSize: 14, color: "#333" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 20 },
  modal: { background: "#fff", borderRadius: 16, padding: 32, width: "100%", maxWidth: 620, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" },
  modalTitle: { fontSize: 20, fontWeight: 700, color: "#1a1a2e", margin: "0 0 20px" },
  form: { display: "flex", flexDirection: "column", gap: 12 },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  label: { fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 },
  input: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" as const },
  formActions: { display: "flex", gap: 10, marginTop: 8 },
  saveBtn: { flex: 1, padding: "12px", background: "#e94560", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 },
  cancelBtn: { flex: 1, padding: "12px", background: "#f5f5f5", color: "#555", border: "none", borderRadius: 8, cursor: "pointer" },
};
