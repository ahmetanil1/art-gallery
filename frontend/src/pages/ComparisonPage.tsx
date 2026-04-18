import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../lib/axios";

export default function ComparisonPage() {
  const [artworkComparisons, setArtworkComparisons] = useState<any[]>([]);
  const [eventComparisons, setEventComparisons] = useState<any[]>([]);
  const [tab, setTab] = useState<"artworks" | "events">("artworks");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [ac, ec] = await Promise.all([
        api.get("/comparisons/").then((r) => r.data),
        api.get("/event-comparisons/").then((r) => r.data),
      ]);
      setArtworkComparisons(ac.results ?? ac);
      setEventComparisons(ec.results ?? ec);
    } catch {
      toast.error("Karşılaştırmalar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number, type: "artwork" | "event") => {
    try {
      await api.delete(type === "artwork" ? `/comparisons/${id}/` : `/event-comparisons/${id}/`);
      toast.success("Karşılaştırma silindi.");
      load();
    } catch {
      toast.error("Silinemedi.");
    }
  };

  const list = tab === "artworks" ? artworkComparisons : eventComparisons;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>⚖️ Karşılaştırmalarım</h1>

      <div style={styles.tabs}>
        <button style={{ ...styles.tab, ...(tab === "artworks" ? styles.activeTab : {}) }} onClick={() => setTab("artworks")}>
          🖼️ Eser Karşılaştırmaları ({artworkComparisons.length})
        </button>
        <button style={{ ...styles.tab, ...(tab === "events" ? styles.activeTab : {}) }} onClick={() => setTab("events")}>
          🎭 Etkinlik Karşılaştırmaları ({eventComparisons.length})
        </button>
      </div>

      {loading ? (
        <div style={styles.loading}>Yükleniyor...</div>
      ) : list.length === 0 ? (
        <div style={styles.empty}>
          <p>Henüz karşılaştırma kaydetmediniz.</p>
          <Link to={tab === "artworks" ? "/artworks" : "/events"} style={styles.browseBtn}>
            {tab === "artworks" ? "Eserlere Git" : "Etkinliklere Git"}
          </Link>
        </div>
      ) : (
        <div style={styles.list}>
          {list.map((comp: any) => {
            const items = tab === "artworks" ? comp.artworks : comp.events;
            return (
              <div key={comp.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.cardTitle}>{comp.name || `Karşılaştırma #${comp.id}`}</h3>
                  <button style={styles.deleteBtn} onClick={() => handleDelete(comp.id, tab === "artworks" ? "artwork" : "event")}>
                    🗑️ Sil
                  </button>
                </div>
                <div style={styles.itemGrid}>
                  {items?.map((item: any) => (
                    <div key={item.id} style={styles.item}>
                      {tab === "artworks" ? (
                        <>
                          <div style={styles.itemImg}>
                            {item.primary_image ? <img src={item.primary_image} alt={item.title} style={styles.img} /> : <span style={{ fontSize: 32 }}>🖼️</span>}
                          </div>
                          <h4 style={styles.itemTitle}>{item.title}</h4>
                          <p style={styles.itemMeta}>👨‍🎨 {item.artist_name}</p>
                          <p style={styles.itemPrice}>₺{Number(item.price).toLocaleString()}</p>
                          <span style={{ ...styles.statusBadge, background: item.status === "available" ? "#27ae60" : "#e74c3c" }}>
                            {item.status === "available" ? "Satışta" : "Kapalı"}
                          </span>
                          <Link to={`/artworks/${item.id}`} style={styles.detailLink}>Detay →</Link>
                        </>
                      ) : (
                        <>
                          <h4 style={styles.itemTitle}>{item.title}</h4>
                          <p style={styles.itemMeta}>📍 {item.location}</p>
                          <p style={styles.itemMeta}>📅 {new Date(item.start_datetime).toLocaleDateString("tr-TR")}</p>
                          <p style={styles.itemMeta}>👥 {item.available_slots}/{item.capacity} kontenjan</p>
                          <p style={styles.itemPrice}>₺{Number(item.price).toLocaleString()}</p>
                          <Link to={`/events/${item.id}`} style={styles.detailLink}>Detay →</Link>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <p style={styles.savedAt}>
                  Kaydedildi: {new Date(comp.saved_at).toLocaleDateString("tr-TR")}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 1100, margin: "0 auto", padding: "24px 16px" },
  title: { fontSize: 28, color: "#1a1a2e", marginBottom: 20 },
  tabs: { display: "flex", borderBottom: "2px solid #f0f0f0", marginBottom: 24 },
  tab: { padding: "12px 24px", background: "none", border: "none", cursor: "pointer", fontSize: 15, color: "#888" },
  activeTab: { color: "#e94560", borderBottom: "2px solid #e94560", fontWeight: 600 },
  loading: { textAlign: "center", padding: 60, color: "#999" },
  empty: { textAlign: "center", padding: 60, color: "#999" },
  browseBtn: { display: "inline-block", marginTop: 16, padding: "10px 24px", background: "#e94560", color: "#fff", textDecoration: "none", borderRadius: 8 },
  list: { display: "flex", flexDirection: "column", gap: 20 },
  card: { background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: 700, color: "#1a1a2e", margin: 0 },
  deleteBtn: { padding: "6px 14px", background: "#fff0f0", color: "#e74c3c", border: "1px solid #ffc5c5", borderRadius: 6, cursor: "pointer", fontSize: 13 },
  itemGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 },
  item: { background: "#f9f9f9", borderRadius: 8, padding: 16, display: "flex", flexDirection: "column", gap: 6 },
  itemImg: { height: 120, background: "#eee", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  img: { width: "100%", height: "100%", objectFit: "cover" },
  itemTitle: { fontSize: 14, fontWeight: 700, color: "#1a1a2e", margin: 0 },
  itemMeta: { fontSize: 12, color: "#666", margin: 0 },
  itemPrice: { fontSize: 16, fontWeight: 700, color: "#e94560", margin: 0 },
  statusBadge: { color: "#fff", padding: "2px 8px", borderRadius: 10, fontSize: 11, alignSelf: "flex-start" },
  detailLink: { fontSize: 13, color: "#3498db", textDecoration: "none", marginTop: 4 },
  savedAt: { fontSize: 12, color: "#aaa", marginTop: 12, textAlign: "right" },
};
