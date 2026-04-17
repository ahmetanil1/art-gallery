import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { eventService } from "../services/eventService";
import type { Event } from "../types";

const TYPE_LABELS: Record<string, string> = {
  workshop: "🎨 Atölye", exhibition: "🖼️ Sergi",
  seminar: "📚 Seminer", tour: "🗺️ Tur", other: "📌 Diğer",
};

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [ordering, setOrdering] = useState("start_datetime");

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { ordering };
      if (search) params.search = search;
      if (type) params.type = type;
      const data = await eventService.list(params);
      setEvents(data.results);
    } catch {
      toast.error("Etkinlikler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, [search, type, ordering]);

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>🎭 Etkinlikler & Atölyeler</h1>

      <div style={styles.filters}>
        <input
          style={styles.searchInput}
          placeholder="🔍 Etkinlik ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select style={styles.select} value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Tüm Türler</option>
          <option value="workshop">Atölye</option>
          <option value="exhibition">Sergi</option>
          <option value="seminar">Seminer</option>
          <option value="tour">Tur</option>
        </select>
        <select style={styles.select} value={ordering} onChange={(e) => setOrdering(e.target.value)}>
          <option value="start_datetime">Tarihe Göre</option>
          <option value="price">Fiyat (Artan)</option>
          <option value="-price">Fiyat (Azalan)</option>
        </select>
      </div>

      {loading ? (
        <div style={styles.loading}>Yükleniyor...</div>
      ) : (
        <div style={styles.grid}>
          {events.map((ev) => {
            const full = ev.available_slots === 0;
            return (
              <div key={ev.id} style={styles.card}>
                <div style={styles.imgWrap}>
                  {ev.image ? (
                    <img src={ev.image} alt={ev.title} style={styles.img} />
                  ) : (
                    <div style={styles.noImg}>🎭</div>
                  )}
                  <span style={styles.typeBadge}>{TYPE_LABELS[ev.event_type] || ev.event_type}</span>
                </div>
                <div style={styles.cardBody}>
                  <h3 style={styles.cardTitle}>{ev.title}</h3>
                  <p style={styles.meta}>📍 {ev.location}</p>
                  <p style={styles.meta}>
                    📅 {new Date(ev.start_datetime).toLocaleDateString("tr-TR", {
                      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                  <div style={styles.capacityRow}>
                    <div style={styles.capacityBar}>
                      <div style={{ ...styles.capacityFill, width: `${ev.occupancy_rate}%`, background: full ? "#e74c3c" : "#27ae60" }} />
                    </div>
                    <span style={styles.capacityText}>
                      {full ? "Dolu" : `${ev.available_slots}/${ev.capacity} kontenjan`}
                    </span>
                  </div>
                  <div style={styles.cardFooter}>
                    <span style={styles.price}>₺{Number(ev.price).toLocaleString()}</span>
                    <Link to={`/events/${ev.id}`} style={styles.detailBtn}>Detay & Rezervasyon</Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 1200, margin: "0 auto", padding: "24px 16px" },
  title: { fontSize: 28, color: "#1a1a2e", marginBottom: 20 },
  filters: { display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" },
  searchInput: { flex: 1, minWidth: 200, padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14 },
  select: { padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, background: "#fff" },
  loading: { textAlign: "center", padding: 60, fontSize: 18, color: "#999" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 },
  card: { background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" },
  imgWrap: { position: "relative", height: 180, background: "#f5f5f5" },
  img: { width: "100%", height: "100%", objectFit: "cover" },
  noImg: { display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 48 },
  typeBadge: { position: "absolute", top: 10, left: 10, background: "#1a1a2e", color: "#fff", fontSize: 11, padding: "3px 10px", borderRadius: 20 },
  cardBody: { padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: 700, color: "#1a1a2e", marginBottom: 8 },
  meta: { fontSize: 13, color: "#666", margin: "4px 0" },
  capacityRow: { display: "flex", alignItems: "center", gap: 8, margin: "10px 0" },
  capacityBar: { flex: 1, height: 6, background: "#eee", borderRadius: 3, overflow: "hidden" },
  capacityFill: { height: "100%", borderRadius: 3, transition: "width 0.3s" },
  capacityText: { fontSize: 12, color: "#666", whiteSpace: "nowrap" },
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  price: { fontSize: 18, fontWeight: 700, color: "#e94560" },
  detailBtn: { background: "#1a1a2e", color: "#fff", textDecoration: "none", padding: "6px 14px", borderRadius: 6, fontSize: 13 },
};
