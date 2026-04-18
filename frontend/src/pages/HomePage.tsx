import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { artworkService } from "../services/artworkService";
import { eventService } from "../services/eventService";
import type { Artwork, Event } from "../types";

export default function HomePage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    artworkService.list({ ordering: "-created_at" }).then((d) => setArtworks(d.results.slice(0, 4)));
    eventService.list({ ordering: "start_datetime", status: "upcoming" }).then((d) => setEvents(d.results.slice(0, 3)));
  }, []);

  return (
    <div style={styles.page}>
      {/* Hero */}
      <div style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>🎨 Online Sanat Galerisi</h1>
          <p style={styles.heroSub}>
            Benzersiz sanat eserlerini keşfedin, atölyelere katılın, sanatla iç içe olun.
          </p>
          <div style={styles.heroBtns}>
            <Link to="/artworks" style={styles.heroBtnPrimary}>Eserleri Keşfet</Link>
            <Link to="/events" style={styles.heroBtnSecondary}>Etkinliklere Bak</Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={styles.stats}>
        {[
          { icon: "🖼️", label: "Eser", value: "12+" },
          { icon: "🎭", label: "Etkinlik", value: "8+" },
          { icon: "👨‍🎨", label: "Sanatçı", value: "6+" },
          { icon: "👥", label: "Kullanıcı", value: "100+" },
        ].map((s) => (
          <div key={s.label} style={styles.statCard}>
            <span style={styles.statIcon}>{s.icon}</span>
            <span style={styles.statValue}>{s.value}</span>
            <span style={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Son Eserler */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Son Eklenen Eserler</h2>
          <Link to="/artworks" style={styles.seeAll}>Tümünü Gör →</Link>
        </div>
        <div style={styles.artGrid}>
          {artworks.map((aw) => (
            <Link to={`/artworks/${aw.id}`} key={aw.id} style={styles.artCard}>
              <div style={styles.artImg}>
                {aw.primary_image
                  ? <img src={aw.primary_image} alt={aw.title} style={styles.img} />
                  : <span style={{ fontSize: 40 }}>🖼️</span>}
              </div>
              <div style={styles.artBody}>
                <h3 style={styles.artTitle}>{aw.title}</h3>
                <p style={styles.artArtist}>👨‍🎨 {aw.artist_name}</p>
                <p style={styles.artPrice}>₺{Number(aw.price).toLocaleString()}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Yaklaşan Etkinlikler */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Yaklaşan Etkinlikler</h2>
          <Link to="/events" style={styles.seeAll}>Tümünü Gör →</Link>
        </div>
        <div style={styles.eventGrid}>
          {events.map((ev) => (
            <Link to={`/events/${ev.id}`} key={ev.id} style={styles.eventCard}>
              <div style={styles.eventType}>{ev.event_type === "workshop" ? "🎨 Atölye" : ev.event_type === "seminar" ? "📚 Seminer" : "🗺️ Tur"}</div>
              <h3 style={styles.eventTitle}>{ev.title}</h3>
              <p style={styles.eventMeta}>📍 {ev.location}</p>
              <p style={styles.eventMeta}>📅 {new Date(ev.start_datetime).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}</p>
              <div style={styles.eventFooter}>
                <span style={styles.eventPrice}>₺{Number(ev.price).toLocaleString()}</span>
                <span style={{ fontSize: 12, color: ev.available_slots === 0 ? "#e74c3c" : "#27ae60" }}>
                  {ev.available_slots === 0 ? "Dolu" : `${ev.available_slots} yer kaldı`}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Kampanya Banner */}
      <div style={styles.banner}>
        <div>
          <h2 style={styles.bannerTitle}>🎟️ Özel İndirimler</h2>
          <p style={styles.bannerSub}>SANAT15 kupon koduyla tüm eserlerde %15 indirim!</p>
        </div>
        <Link to="/campaigns" style={styles.bannerBtn}>Kampanyaları Gör</Link>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 1200, margin: "0 auto", padding: "0 16px 40px" },
  hero: { background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)", borderRadius: "0 0 24px 24px", padding: "80px 40px", marginBottom: 40, textAlign: "center" },
  heroContent: {},
  heroTitle: { fontSize: 48, color: "#fff", margin: "0 0 16px", fontWeight: 800 },
  heroSub: { fontSize: 18, color: "#aaa", margin: "0 0 32px", maxWidth: 500, marginLeft: "auto", marginRight: "auto" },
  heroBtns: { display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" },
  heroBtnPrimary: { padding: "14px 32px", background: "#e94560", color: "#fff", textDecoration: "none", borderRadius: 10, fontSize: 16, fontWeight: 700 },
  heroBtnSecondary: { padding: "14px 32px", background: "transparent", color: "#fff", textDecoration: "none", borderRadius: 10, fontSize: 16, border: "2px solid rgba(255,255,255,0.3)" },
  stats: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 48 },
  statCard: { background: "#fff", borderRadius: 12, padding: 24, textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: 4 },
  statIcon: { fontSize: 28 },
  statValue: { fontSize: 28, fontWeight: 800, color: "#e94560" },
  statLabel: { fontSize: 13, color: "#888" },
  section: { marginBottom: 48 },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  sectionTitle: { fontSize: 22, fontWeight: 700, color: "#1a1a2e", margin: 0 },
  seeAll: { color: "#e94560", textDecoration: "none", fontSize: 14, fontWeight: 600 },
  artGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 },
  artCard: { background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", textDecoration: "none", color: "inherit", display: "block" },
  artImg: { height: 180, background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  img: { width: "100%", height: "100%", objectFit: "cover" },
  artBody: { padding: 16 },
  artTitle: { fontSize: 15, fontWeight: 700, color: "#1a1a2e", margin: "0 0 4px" },
  artArtist: { fontSize: 13, color: "#888", margin: "0 0 8px" },
  artPrice: { fontSize: 16, fontWeight: 700, color: "#e94560", margin: 0 },
  eventGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 },
  eventCard: { background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", textDecoration: "none", color: "inherit", display: "block" },
  eventType: { fontSize: 12, color: "#888", marginBottom: 8 },
  eventTitle: { fontSize: 16, fontWeight: 700, color: "#1a1a2e", margin: "0 0 8px" },
  eventMeta: { fontSize: 13, color: "#666", margin: "2px 0" },
  eventFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  eventPrice: { fontSize: 18, fontWeight: 700, color: "#e94560" },
  banner: { background: "linear-gradient(135deg, #e94560, #c0392b)", borderRadius: 16, padding: "32px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 },
  bannerTitle: { fontSize: 24, color: "#fff", margin: "0 0 8px", fontWeight: 700 },
  bannerSub: { fontSize: 15, color: "rgba(255,255,255,0.85)", margin: 0 },
  bannerBtn: { padding: "12px 28px", background: "#fff", color: "#e94560", textDecoration: "none", borderRadius: 8, fontWeight: 700, fontSize: 15 },
};
