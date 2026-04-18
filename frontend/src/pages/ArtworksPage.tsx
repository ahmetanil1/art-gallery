import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { artworkService } from "../services/artworkService";
import { useCartStore } from "../store/cartStore";
import { useAuthStore } from "../store/authStore";
import type { Artwork } from "../types";
import StarRating from "../components/StarRating";

export default function ArtworksPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [ordering, setOrdering] = useState("-created_at");
  const [count, setCount] = useState(0);
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const fetchArtworks = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { ordering };
      if (search) params.search = search;
      if (status) params.status = status;
      const data = await artworkService.list(params);
      setArtworks(data.results);
      setCount(data.count);
    } catch {
      toast.error("Eserler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchArtworks(); }, [search, status, ordering]);

  const handleFavorite = async (artwork: Artwork) => {
    try {
      if (artwork.is_favorited) {
        toast("Favorilerden çıkarmak için favori sayfasını kullanın.");
      } else {
        await artworkService.addFavorite(artwork.id);
        toast.success("Favorilere eklendi!");
        fetchArtworks();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "İşlem başarısız.");
    }
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>🖼️ Eserler <span style={styles.count}>({count})</span></h1>

      {/* Filtreler */}
      <div style={styles.filters}>
        <input
          style={styles.searchInput}
          placeholder="🔍 Eser veya sanatçı ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select style={styles.select} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tüm Durumlar</option>
          <option value="available">Satışta</option>
          <option value="sold">Satıldı</option>
          <option value="not_for_sale">Satışa Kapalı</option>
        </select>
        <select style={styles.select} value={ordering} onChange={(e) => setOrdering(e.target.value)}>
          <option value="-created_at">En Yeni</option>
          <option value="price">Fiyat (Artan)</option>
          <option value="-price">Fiyat (Azalan)</option>
          <option value="-view_count">En Çok Görüntülenen</option>
        </select>
      </div>

      {loading ? (
        <div style={styles.loading}>Yükleniyor...</div>
      ) : (
        <div style={styles.grid}>
          {artworks.map((aw) => (
            <div key={aw.id} style={styles.card}>
              <div style={styles.imgWrap}>
                {aw.primary_image ? (
                  <img src={aw.primary_image} alt={aw.title} style={styles.img} />
                ) : (
                  <div style={styles.noImg}>🖼️</div>
                )}
                <span style={{ ...styles.badge, background: aw.status === "available" ? "#27ae60" : "#e74c3c" }}>
                  {aw.status === "available" ? "Satışta" : aw.status === "sold" ? "Satıldı" : "Kapalı"}
                </span>
              </div>
              <div style={styles.cardBody}>
                <h3 style={styles.cardTitle}>{aw.title}</h3>
                <p style={styles.artist}>👨‍🎨 {aw.artist_name}</p>
                {aw.avg_rating && <StarRating rating={Math.round(aw.avg_rating)} />}
                <div style={styles.cardFooter}>
                  <span style={styles.price}>₺{Number(aw.price).toLocaleString()}</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      style={{ ...styles.favBtn, color: aw.is_favorited ? "#e94560" : "#999" }}
                      onClick={() => handleFavorite(aw)}
                    >
                      {aw.is_favorited ? "❤️" : "🤍"}
                    </button>
                    {aw.status === "available" && isAuthenticated && (
                      <button
                        style={styles.cartBtn}
                        onClick={async () => {
                          try { await addItem(aw.id); toast.success("Sepete eklendi!"); }
                          catch (err: any) { toast.error(err.response?.data?.detail || "Hata."); }
                        }}
                      >
                        🛒
                      </button>
                    )}
                    <Link to={`/artworks/${aw.id}`} style={styles.detailBtn}>Detay</Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 1200, margin: "0 auto", padding: "24px 16px" },
  title: { fontSize: 28, color: "#1a1a2e", marginBottom: 20 },
  count: { fontSize: 16, color: "#999", fontWeight: 400 },
  filters: { display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" },
  searchInput: { flex: 1, minWidth: 200, padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14 },
  select: { padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, background: "#fff" },
  loading: { textAlign: "center", padding: 60, fontSize: 18, color: "#999" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 },
  card: { background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", transition: "transform 0.2s" },
  imgWrap: { position: "relative", height: 200, background: "#f5f5f5" },
  img: { width: "100%", height: "100%", objectFit: "cover" },
  noImg: { display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 48 },
  badge: { position: "absolute", top: 10, right: 10, color: "#fff", fontSize: 11, padding: "3px 8px", borderRadius: 20, fontWeight: 600 },
  cardBody: { padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: 700, color: "#1a1a2e", marginBottom: 4 },
  artist: { fontSize: 13, color: "#666", marginBottom: 8 },
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  price: { fontSize: 18, fontWeight: 700, color: "#e94560" },
  favBtn: { background: "none", border: "none", fontSize: 20, cursor: "pointer", padding: 4 },
  detailBtn: { background: "#1a1a2e", color: "#fff", textDecoration: "none", padding: "6px 14px", borderRadius: 6, fontSize: 13 },
  cartBtn: { background: "#e94560", color: "#fff", border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontSize: 14 },
};
