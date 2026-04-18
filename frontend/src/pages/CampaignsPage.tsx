import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { campaignService } from "../services/campaignService";
import type { Campaign } from "../types";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    campaignService.list(true)
      .then((data) => setCampaigns(Array.isArray(data) ? data : (data as any).results ?? []))
      .catch(() => toast.error("Kampanyalar yüklenemedi."))
      .finally(() => setLoading(false));
  }, []);

  const handleCouponCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    setCouponResult(null);
    try {
      const result = await campaignService.validateCoupon(couponCode);
      setCouponResult(result);
      toast.success("Kupon geçerli! 🎉");
    } catch (err: any) {
      toast.error(err.response?.data?.code?.[0] || "Geçersiz kupon kodu.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>🎟️ Kampanyalar & İndirimler</h1>

      {/* Kupon sorgulama */}
      <div style={styles.couponBox}>
        <h2 style={styles.sectionTitle}>Kupon Kodu Sorgula</h2>
        <form onSubmit={handleCouponCheck} style={styles.couponForm}>
          <input
            style={styles.couponInput}
            placeholder="Kupon kodunuzu girin (örn: SANAT15)"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            required
          />
          <button style={styles.couponBtn} type="submit" disabled={checking}>
            {checking ? "Kontrol ediliyor..." : "Sorgula"}
          </button>
        </form>
        {couponResult && (
          <div style={styles.couponResult}>
            <span style={styles.couponValid}>✅ Geçerli Kupon</span>
            <div style={styles.couponDetails}>
              <span>Kod: <strong>{couponResult.code}</strong></span>
              <span>İndirim: <strong style={{ color: "#e94560" }}>%{couponResult.discount_rate}</strong></span>
              <span>Kampanya: <strong>{couponResult.campaign}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Aktif kampanyalar */}
      <h2 style={styles.sectionTitle}>Aktif Kampanyalar</h2>
      {loading ? (
        <div style={styles.loading}>Yükleniyor...</div>
      ) : campaigns.length === 0 ? (
        <div style={styles.empty}>Şu an aktif kampanya bulunmuyor.</div>
      ) : (
        <div style={styles.grid}>
          {campaigns.map((c) => (
            <div key={c.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>{c.name}</h3>
                <span style={styles.discountBadge}>
                  {c.discount_type === "percentage" ? `%${c.discount_rate}` : `₺${c.discount_rate}`} İndirim
                </span>
              </div>
              <p style={styles.cardDesc}>{c.description}</p>
              <div style={styles.cardFooter}>
                <span style={styles.dateRange}>
                  📅 {new Date(c.start_date).toLocaleDateString("tr-TR")} –{" "}
                  {new Date(c.end_date).toLocaleDateString("tr-TR")}
                </span>
                <span style={styles.activeBadge}>✓ Aktif</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mevcut kuponlar bilgisi */}
      <div style={styles.infoBox}>
        <h3>💡 Mevcut Kupon Kodları</h3>
        <div style={styles.couponList}>
          {[
            { code: "SANAT15", desc: "Tüm eser ve etkinliklerde %15 indirim" },
            { code: "YENIMÜŞTERI", desc: "Yeni müşterilere özel %20 indirim" },
            { code: "OGRENCI10", desc: "Öğrencilere özel %10 indirim" },
          ].map((c) => (
            <div key={c.code} style={styles.couponItem}>
              <code style={styles.code}>{c.code}</code>
              <span style={styles.couponItemDesc}>{c.desc}</span>
              <button
                style={styles.copyBtn}
                onClick={() => { navigator.clipboard.writeText(c.code); toast.success("Kopyalandı!"); }}
              >
                📋 Kopyala
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 900, margin: "0 auto", padding: "24px 16px" },
  title: { fontSize: 28, color: "#1a1a2e", marginBottom: 24 },
  sectionTitle: { fontSize: 20, color: "#1a1a2e", marginBottom: 16 },
  couponBox: { background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: 32 },
  couponForm: { display: "flex", gap: 12 },
  couponInput: { flex: 1, padding: "12px 16px", borderRadius: 8, border: "2px solid #ddd", fontSize: 16, letterSpacing: 2, textTransform: "uppercase" },
  couponBtn: { padding: "12px 24px", background: "#e94560", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 15 },
  couponResult: { marginTop: 16, padding: 16, background: "#eafaf1", borderRadius: 8, border: "1px solid #a9dfbf" },
  couponValid: { fontSize: 16, fontWeight: 700, color: "#27ae60" },
  couponDetails: { display: "flex", gap: 24, marginTop: 8, fontSize: 14, color: "#555" },
  loading: { textAlign: "center", padding: 40, color: "#999" },
  empty: { textAlign: "center", padding: 40, color: "#999", background: "#fff", borderRadius: 12 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginBottom: 32 },
  card: { background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: 700, color: "#1a1a2e", margin: 0, flex: 1 },
  discountBadge: { background: "#e94560", color: "#fff", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" },
  cardDesc: { fontSize: 14, color: "#666", lineHeight: 1.5, marginBottom: 12 },
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  dateRange: { fontSize: 12, color: "#aaa" },
  activeBadge: { fontSize: 12, color: "#27ae60", fontWeight: 600 },
  infoBox: { background: "#f9f9f9", borderRadius: 12, padding: 24, border: "1px solid #eee" },
  couponList: { display: "flex", flexDirection: "column", gap: 12, marginTop: 12 },
  couponItem: { display: "flex", alignItems: "center", gap: 16, background: "#fff", padding: "12px 16px", borderRadius: 8, border: "1px solid #eee" },
  code: { background: "#1a1a2e", color: "#fff", padding: "4px 12px", borderRadius: 6, fontSize: 14, fontWeight: 700, letterSpacing: 1 },
  couponItemDesc: { flex: 1, fontSize: 14, color: "#555" },
  copyBtn: { padding: "6px 14px", background: "#f0f4ff", color: "#3498db", border: "1px solid #c5d5ff", borderRadius: 6, cursor: "pointer", fontSize: 13 },
};
