import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { adminService } from "../../services/adminService";

interface DashboardData {
  users: any;
  artworks: any;
  events: any;
  orders: any;
  reservations: any;
  reviews: any;
  support: any;
  daily_orders: { date: string; orders: number; revenue: number }[];
  top_artworks: any[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getDashboard()
      .then(setData)
      .catch(() => toast.error("Dashboard yüklenemedi."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={styles.loading}>Yükleniyor...</div>;
  if (!data) return null;

  const maxRevenue = Math.max(...data.daily_orders.map((d) => d.revenue), 1);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Admin Dashboard</h1>
        <div style={styles.headerLinks}>
          <Link to="/admin/users" style={styles.headerBtn}>Kullanıcılar</Link>
          <Link to="/admin/artworks" style={styles.headerBtn}>Eserler</Link>
          <Link to="/admin/events" style={styles.headerBtn}>Etkinlikler</Link>
          <Link to="/admin/analytics" style={styles.headerBtn}>Analitik</Link>
        </div>
      </div>

      {/* Stat kartları */}
      <div style={styles.statsGrid}>
        {[
          { icon: "👥", label: "Toplam Kullanıcı", value: data.users.total, sub: `+${data.users.new_last_7_days} bu hafta`, color: "#3498db" },
          { icon: "🖼️", label: "Toplam Eser", value: data.artworks.total, sub: `${data.artworks.available} satışta`, color: "#27ae60" },
          { icon: "🛒", label: "Toplam Sipariş", value: data.orders.total, sub: `${data.orders.pending} beklemede`, color: "#e94560" },
          { icon: "💰", label: "Toplam Gelir", value: `₺${Number(data.orders.revenue_total).toLocaleString()}`, sub: `₺${Number(data.orders.revenue_last_30_days).toLocaleString()} (30 gün)`, color: "#f39c12" },
          { icon: "📋", label: "Rezervasyonlar", value: data.reservations.total, sub: `${data.reservations.confirmed} onaylı`, color: "#9b59b6" },
          { icon: "🎭", label: "Etkinlikler", value: data.events.total, sub: `${data.events.upcoming} yaklaşan`, color: "#1abc9c" },
          { icon: "⭐", label: "Yorumlar", value: data.reviews.artwork_reviews + data.reviews.event_reviews, sub: `${data.reviews.pending_approval} onay bekliyor`, color: "#e67e22" },
          { icon: "🎧", label: "Destek Talepleri", value: data.support.open + data.support.in_progress, sub: `${data.support.open} açık`, color: "#e74c3c" },
        ].map((s) => (
          <div key={s.label} style={styles.statCard}>
            <div style={{ ...styles.statIcon, background: s.color + "20", color: s.color }}>{s.icon}</div>            <div>
              <div style={styles.statValue}>{s.value}</div>
              <div style={styles.statLabel}>{s.label}</div>
              <div style={styles.statSub}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.bottomGrid}>
        {/* Günlük sipariş grafiği */}
        <div style={styles.chartCard}>
          <h2 style={styles.cardTitle}>Son 7 Gün Siparişler</h2>
          <div style={styles.barChart}>
            {data.daily_orders.map((d) => (
              <div key={d.date} style={styles.barGroup}>
                <div style={styles.barLabel}>₺{d.revenue > 0 ? (d.revenue / 1000).toFixed(1) + "k" : "0"}</div>
                <div style={styles.barWrapper}>
                  <div
                    style={{
                      ...styles.bar,
                      height: `${Math.max((d.revenue / maxRevenue) * 140, d.orders > 0 ? 8 : 0)}px`,
                      background: d.revenue > 0 ? "#e94560" : "#eee",
                    }}
                  />
                </div>
                <div style={styles.barDate}>{d.date}</div>
                <div style={styles.barOrders}>{d.orders} sipariş</div>
              </div>
            ))}
          </div>
        </div>

        {/* En çok görüntülenen eserler */}
        <div style={styles.chartCard}>
          <h2 style={styles.cardTitle}>En Çok Görüntülenen Eserler</h2>
          <div style={styles.topList}>
            {data.top_artworks.map((aw, i) => (
              <div key={aw.id} style={styles.topItem}>
                <span style={styles.topRank}>#{i + 1}</span>
                <div style={styles.topInfo}>
                  <span style={styles.topTitle}>{aw.title}</span>
                  <span style={styles.topMeta}>₺{Number(aw.price).toLocaleString()}</span>
                </div>
                <div style={styles.topRight}>
                  <span style={styles.viewCount}>{aw.view_count} görüntülenme</span>
                  <span style={{ ...styles.statusDot, background: aw.status === "available" ? "#27ae60" : "#e74c3c" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.quickAccess}>
        <h2 style={styles.cardTitle}>Hızlı Erişim</h2>
        <div style={styles.quickGrid}>
          {[
            { to: "/admin/events", label: "Etkinlik Yönetimi" },
            { to: "/admin/artworks", label: "Eser Yönetimi" },
            { to: "/admin/users", label: "Kullanıcı Yönetimi" },
            { to: "/admin/analytics", label: "Detaylı Analitik" },
            { to: "http://localhost:8000/admin/", label: "Django Admin", external: true },
          ].map((item) => (
            item.external ? (
              <a key={item.label} href={item.to} target="_blank" rel="noreferrer" style={styles.quickCard}>
                <span style={styles.quickLabel}>{item.label}</span>
              </a>
            ) : (
              <Link key={item.label} to={item.to} style={styles.quickCard}>
                <span style={styles.quickLabel}>{item.label}</span>
              </Link>
            )
          ))}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 1200, margin: "0 auto", padding: "24px 16px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { fontSize: 28, color: "#1a1a2e", margin: 0 },
  headerLinks: { display: "flex", gap: 10 },
  headerBtn: { padding: "8px 16px", background: "#1a1a2e", color: "#fff", textDecoration: "none", borderRadius: 8, fontSize: 13, fontWeight: 600 },
  loading: { textAlign: "center", padding: 80, fontSize: 18, color: "#999" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginBottom: 24 },
  statCard: { background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", gap: 16, alignItems: "center" },
  statIcon: { width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 },
  statValue: { fontSize: 22, fontWeight: 800, color: "#1a1a2e" },
  statLabel: { fontSize: 13, color: "#888", marginTop: 2 },
  statSub: { fontSize: 11, color: "#aaa", marginTop: 2 },
  bottomGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 },
  chartCard: { background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
  cardTitle: { fontSize: 16, fontWeight: 700, color: "#1a1a2e", marginBottom: 20 },
  barChart: { display: "flex", gap: 12, alignItems: "flex-end", height: 180, paddingBottom: 8 },
  barGroup: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  barLabel: { fontSize: 10, color: "#aaa" },
  barWrapper: { width: "100%", display: "flex", justifyContent: "center", alignItems: "flex-end", height: 140 },
  bar: { width: "60%", borderRadius: "4px 4px 0 0", transition: "height 0.3s", minHeight: 2 },
  barDate: { fontSize: 11, color: "#888" },
  barOrders: { fontSize: 10, color: "#aaa" },
  topList: { display: "flex", flexDirection: "column", gap: 12 },
  topItem: { display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid #f5f5f5" },
  topRank: { fontSize: 16, fontWeight: 800, color: "#e94560", width: 28 },
  topInfo: { flex: 1 },
  topTitle: { fontSize: 14, fontWeight: 600, color: "#1a1a2e", display: "block" },
  topMeta: { fontSize: 12, color: "#888" },
  topRight: { display: "flex", alignItems: "center", gap: 8 },
  viewCount: { fontSize: 13, color: "#666" },
  statusDot: { width: 8, height: 8, borderRadius: "50%" },
  quickAccess: { background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
  quickGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 },
  quickCard: { display: "flex", alignItems: "center", justifyContent: "center", padding: "18px 12px", background: "#f9f9f9", borderRadius: 10, textDecoration: "none", color: "#1a1a2e", border: "1px solid #eee", fontWeight: 600, fontSize: 14 },
  quickLabel: { fontSize: 14, fontWeight: 600, color: "#333", textAlign: "center" },
};
