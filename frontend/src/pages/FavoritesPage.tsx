import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { artworkService } from "../services/artworkService";

interface Favorite {
  id: number;
  artwork: {
    id: number;
    title: string;
    artist_name: string;
    price: string;
    status: string;
    primary_image: string | null;
  };
  created_at: string;
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await artworkService.getFavorites();
      setFavorites(Array.isArray(data) ? data : data.results);
    } catch {
      toast.error("Favoriler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRemove = async (favoriteId: number) => {
    try {
      await artworkService.removeFavorite(favoriteId);
      toast.success("Favorilerden çıkarıldı.");
      load();
    } catch {
      toast.error("İşlem başarısız.");
    }
  };

  if (loading) return <div style={styles.loading}>Yükleniyor...</div>;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>❤️ Favorilerim ({favorites.length})</h1>

      {favorites.length === 0 ? (
        <div style={styles.empty}>
          <p>Henüz favori eseriniz yok.</p>
          <Link to="/artworks" style={styles.browseBtn}>Eserlere Göz At</Link>
        </div>
      ) : (
        <div style={styles.grid}>
          {favorites.map((fav) => (
            <div key={fav.id} style={styles.card}>
              <div style={styles.imgWrap}>
                {fav.artwork.primary_image ? (
                  <img src={fav.artwork.primary_image} alt={fav.artwork.title} style={styles.img} />
                ) : (
                  <div style={styles.noImg}>🖼️</div>
                )}
              </div>
              <div style={styles.cardBody}>
                <h3 style={styles.cardTitle}>{fav.artwork.title}</h3>
                <p style={styles.artist}>👨‍🎨 {fav.artwork.artist_name}</p>
                <p style={styles.price}>₺{Number(fav.artwork.price).toLocaleString()}</p>
                <div style={styles.actions}>
                  <Link to={`/artworks/${fav.artwork.id}`} style={styles.detailBtn}>Detay</Link>
                  <button style={styles.removeBtn} onClick={() => handleRemove(fav.id)}>
                    🗑️ Çıkar
                  </button>
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
  loading: { textAlign: "center", padding: 80, fontSize: 18, color: "#999" },
  empty: { textAlign: "center", padding: 60, color: "#999" },
  browseBtn: { display: "inline-block", marginTop: 16, padding: "10px 24px", background: "#e94560", color: "#fff", textDecoration: "none", borderRadius: 8 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 },
  card: { background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" },
  imgWrap: { height: 180, background: "#f5f5f5" },
  img: { width: "100%", height: "100%", objectFit: "cover" },
  noImg: { display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 48 },
  cardBody: { padding: 16 },
  cardTitle: { fontSize: 15, fontWeight: 700, color: "#1a1a2e", marginBottom: 4 },
  artist: { fontSize: 13, color: "#666", marginBottom: 8 },
  price: { fontSize: 16, fontWeight: 700, color: "#e94560", marginBottom: 12 },
  actions: { display: "flex", gap: 8 },
  detailBtn: { flex: 1, textAlign: "center", background: "#1a1a2e", color: "#fff", textDecoration: "none", padding: "8px", borderRadius: 6, fontSize: 13 },
  removeBtn: { padding: "8px 12px", background: "#fff0f0", color: "#e74c3c", border: "1px solid #ffc5c5", borderRadius: 6, cursor: "pointer", fontSize: 13 },
};
