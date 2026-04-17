import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.brand}>
        <Link to="/" style={styles.brandLink}>🎨 Sanat Galerisi</Link>
      </div>
      <div style={styles.links}>
        <Link to="/artworks" style={styles.link}>Eserler</Link>
        <Link to="/events" style={styles.link}>Etkinlikler</Link>
        {isAuthenticated ? (
          <>
            <Link to="/favorites" style={styles.link}>❤️ Favoriler</Link>
            <Link to="/reservations" style={styles.link}>Rezervasyonlar</Link>
            <Link to="/orders" style={styles.link}>Siparişler</Link>
            <Link to="/support" style={styles.link}>Destek</Link>
            <Link to="/profile" style={styles.link}>👤 {user?.first_name || user?.email}</Link>
            <button onClick={handleLogout} style={styles.logoutBtn}>Çıkış</button>
          </>
        ) : (
          <>
            <Link to="/login" style={styles.link}>Giriş</Link>
            <Link to="/register" style={styles.registerBtn}>Kayıt Ol</Link>
          </>
        )}
      </div>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "12px 32px", background: "#1a1a2e", color: "#fff",
    position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
  },
  brand: { fontSize: 20, fontWeight: 700 },
  brandLink: { color: "#e94560", textDecoration: "none" },
  links: { display: "flex", gap: 16, alignItems: "center" },
  link: { color: "#ccc", textDecoration: "none", fontSize: 14 },
  logoutBtn: {
    background: "#e94560", color: "#fff", border: "none",
    padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 14,
  },
  registerBtn: {
    background: "#e94560", color: "#fff", textDecoration: "none",
    padding: "6px 14px", borderRadius: 6, fontSize: 14,
  },
};
