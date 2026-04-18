import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminService } from "../../services/adminService";

export default function AdminAnalytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getAnalytics()
      .then(setData)
      .catch(() => toast.error("Analitik yüklenemedi."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={styles.loading}>📈 Yükleniyor...</div>;
  if (!data) return null;

  const maxRevenue = Math.max(...(data.monthly_revenue || []).map((m: any) => m.revenue), 1);

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>📈 Sistem Analizleri</h1>

      <div style={styles.grid}>
        {/* Aylık Gelir */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>💰 Aylık Gelir (Son 6 Ay)</h2>
          <div style={styles.barChart}>
            {data.monthly_revenue?.map((m: any) => (
              <div key={m.month} style={styles.barGroup}>
                <div style={styles.barLabel}>₺{m.revenue > 0 ? (m.revenue / 1000).toFixed(0) + "k" : "0"}</div>
                <div style={styles.barWrapper}>
                  <div style={{ ...styles.bar, height: `${Math.max((m.revenue / maxRevenue) * 120, m.revenue > 0 ? 6 : 0)}px` }} />
                </div>
                <div style={styles.barDate}>{m.month}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Kategori Dağılımı */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🏷️ Kategori Bazlı Eserler</h2>
          <div style={styles.categoryList}>
            {data.category_stats?.map((c: any) => {
              const total = c.artwork_count || 1;
              const soldPct = Math.round((c.sold_count / total) * 100);
              return (
                <div key={c.name} style={styles.categoryItem}>
                  <div style={styles.categoryHeader}>
                    <span style={styles.categoryName}>{c.name}</span>
                    <span style={styles.categoryCount}>{c.artwork_count} eser</span>
                  </div>
                  <div style={styles.progressBar}>
                    <div style={{ ...styles.progressFill, width: `${soldPct}%` }} />
                  </div>
                  <div style={styles.categoryMeta}>
                    <span style={{ color: "#e74c3c" }}>{c.sold_count} satıldı</span>
                    <span style={{ color: "#aaa" }}>%{soldPct} satış oranı</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* En Çok Satan Eserler */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🏆 En Çok Satan Eserler</h2>
          <div style={styles.rankList}>
            {data.top_selling_artworks?.slice(0, 8).map((item: any, i: number) => (
              <div key={item.artwork__id} style={styles.rankItem}>
                <span style={styles.rank}>#{i + 1}</span>
                <div style={styles.rankInfo}>
                  <span style={styles.rankTitle}>{item.artwork__title}</span>
                  <span style={styles.rankMeta}>₺{Number(item.total_revenue || 0).toLocaleString()} gelir</span>
                </div>
                <span style={styles.rankCount}>{item.total_sold} satış</span>
              </div>
            ))}
            {(!data.top_selling_artworks || data.top_selling_artworks.length === 0) && (
              <p style={{ color: "#aaa", textAlign: "center", padding: 20 }}>Henüz satış yok.</p>
            )}
          </div>
        </div>

        {/* Etkinlik Doluluk */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🎭 Etkinlik Doluluk Oranları</h2>
          <div style={styles.eventList}>
            {data.event_occupancy?.map((ev: any) => (
              <div key={ev.id} style={styles.eventItem}>
                <div style={styles.eventHeader}>
                  <span style={styles.eventTitle}>{ev.title}</span>
                  <span style={{ ...styles.occupancyBadge, background: ev.occupancy_rate >= 90 ? "#e74c3c" : ev.occupancy_rate >= 60 ? "#f39c12" : "#27ae60" }}>
                    %{ev.occupancy_rate.toFixed(0)}
                  </span>
                </div>
                <div style={styles.progressBar}>
                  <div style={{ ...styles.progressFill, width: `${ev.occupancy_rate}%`, background: ev.occupancy_rate >= 90 ? "#e74c3c" : ev.occupancy_rate >= 60 ? "#f39c12" : "#27ae60" }} />
                </div>
                <div style={styles.eventMeta}>
                  <span>{ev.capacity - ev.available_slots}/{ev.capacity} kişi</span>
                  <span style={{ color: "#aaa" }}>{ev.available_slots} yer kaldı</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rezervasyon Durum Dağılımı */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>📋 Rezervasyon Durumları</h2>
          <div style={styles.statusList}>
            {data.reservation_stats?.map((s: any) => {
              const statusColors: Record<string, string> = { pending: "#f39c12", confirmed: "#27ae60", cancelled: "#e74c3c", completed: "#3498db", no_show: "#95a5a6" };
              const statusLabels: Record<string, string> = { pending: "Beklemede", confirmed: "Onaylı", cancelled: "İptal", completed: "Tamamlandı", no_show: "Gelmedi" };
              return (
                <div key={s.status} style={styles.statusItem}>
                  <div style={{ ...styles.statusDot, background: statusColors[s.status] || "#999" }} />
                  <span style={styles.statusLabel}>{statusLabels[s.status] || s.status}</span>
                  <span style={styles.statusCount}>{s.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 1200, margin: "0 auto", padding: "24px 16px" },
  title: { fontSize: 28, color: "#1a1a2e", marginBottom: 24 },
  loading: { textAlign: "center", padding: 80, fontSize: 18, color: "#999" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(480px, 1fr))", gap: 20 },
  card: { background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
  cardTitle: { fontSize: 16, fontWeight: 700, color: "#1a1a2e", marginBottom: 20 },
  barChart: { display: "flex", gap: 8, alignItems: "flex-end", height: 160 },
  barGroup: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  barLabel: { fontSize: 10, color: "#aaa" },
  barWrapper: { width: "100%", display: "flex", justifyContent: "center", alignItems: "flex-end", height: 120 },
  bar: { width: "60%", background: "#e94560", borderRadius: "4px 4px 0 0", minHeight: 2 },
  barDate: { fontSize: 10, color: "#888", textAlign: "center" },
  categoryList: { display: "flex", flexDirection: "column", gap: 14 },
  categoryItem: {},
  categoryHeader: { display: "flex", justifyContent: "space-between", marginBottom: 6 },
  categoryName: { fontSize: 14, fontWeight: 600, color: "#333" },
  categoryCount: { fontSize: 13, color: "#888" },
  progressBar: { height: 8, background: "#f0f0f0", borderRadius: 4, overflow: "hidden", marginBottom: 4 },
  progressFill: { height: "100%", background: "#e94560", borderRadius: 4, transition: "width 0.5s" },
  categoryMeta: { display: "flex", justifyContent: "space-between", fontSize: 12 },
  rankList: { display: "flex", flexDirection: "column", gap: 10 },
  rankItem: { display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid #f5f5f5" },
  rank: { fontSize: 16, fontWeight: 800, color: "#e94560", width: 28 },
  rankInfo: { flex: 1 },
  rankTitle: { fontSize: 14, fontWeight: 600, color: "#1a1a2e", display: "block" },
  rankMeta: { fontSize: 12, color: "#888" },
  rankCount: { fontSize: 14, fontWeight: 700, color: "#27ae60" },
  eventList: { display: "flex", flexDirection: "column", gap: 14 },
  eventItem: {},
  eventHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  eventTitle: { fontSize: 13, fontWeight: 600, color: "#333", flex: 1, marginRight: 8 },
  occupancyBadge: { color: "#fff", padding: "2px 8px", borderRadius: 10, fontSize: 12, fontWeight: 700 },
  eventMeta: { display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 4 },
  statusList: { display: "flex", flexDirection: "column", gap: 12 },
  statusItem: { display: "flex", alignItems: "center", gap: 12 },
  statusDot: { width: 12, height: 12, borderRadius: "50%", flexShrink: 0 },
  statusLabel: { flex: 1, fontSize: 14, color: "#333" },
  statusCount: { fontSize: 18, fontWeight: 700, color: "#1a1a2e" },
};
