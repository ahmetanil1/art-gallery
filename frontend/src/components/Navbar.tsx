import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useCartStore } from "../store/cartStore";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { item_count, fetchCart } = useCartStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) fetchCart().catch(() => {});
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setMenuOpen(false);
  };

  const isActive = (path: string) =>
    location.pathname.startsWith(path) ? styles.activeLink : styles.link;

  return (
    <nav style={styles.nav}>
      <div style={styles.left}>
        <Link to="/" style={styles.brand}>🎨 Sanat Galerisi</Link>
        <div style={styles.navLinks}>
          <Link to="/artworks" style={isActive("/artworks")}>Eserler</Link>
          <Link to="/events" style={isActive("/events")}>Etkinlikler</Link>
          <Link to="/campaigns" style={isActive("/campaigns")}>Kampanyalar</Link>
        </div>
      </div>

      <div style={styles.right}>
        {isAuthenticated ? (
          <>
            <Link to="/favorites" style={isActive("/favorites")}>❤️</Link>
            <Link to="/comparisons" style={isActive("/comparisons")}>⚖️</Link>
            <Link to="/cart" style={{ ...isActive("/cart"), position: "relative" }}>
              🛒
              {item_count > 0 && (
                <span style={styles.cartBadge}>{item_count}</span>
              )}
            </Link>
            <Link to="/reservations" style={isActive("/reservations")}>📋</Link>
            <Link to="/orders" style={isActive("/orders")}>📦</Link>
            <Link to="/support" style={isActive("/support")}>🎧</Link>

            {/* User dropdown */}
            <div style={styles.userMenu}>
              <button style={styles.userBtn} onClick={() => setMenuOpen(!menuOpen)}>
                <span style={styles.avatar}>
                  {user?.first_name?.[0]?.toUpperCase() || "👤"}
                </span>
                <span style={styles.userName}>
                  {user?.first_name || user?.email?.split("@")[0]}
                </span>
                <span>▾</span>
              </button>
              {menuOpen && (
                <div style={styles.dropdown}>
                  <Link to="/profile" style={styles.dropItem} onClick={() => setMenuOpen(false)}>
                    👤 Profilim
                  </Link>
                  <Link to="/orders" style={styles.dropItem} onClick={() => setMenuOpen(false)}>
                    🛒 Siparişlerim
                  </Link>
                  <Link to="/reservations" style={styles.dropItem} onClick={() => setMenuOpen(false)}>
                    📋 Rezervasyonlarım
                  </Link>
                  {(user?.role === "admin" || user?.role === "gallery_manager") && (
                    <>
                      <Link to="/admin" style={{ ...styles.dropItem, color: "#e94560", fontWeight: 600 }} onClick={() => setMenuOpen(false)}>
                        📊 Admin Dashboard
                      </Link>
                      <Link to="/admin/events" style={styles.dropItem} onClick={() => setMenuOpen(false)}>
                        🎭 Etkinlik Yönetimi
                      </Link>
                      <Link to="/admin/users" style={styles.dropItem} onClick={() => setMenuOpen(false)}>
                        👥 Kullanıcı Yönetimi
                      </Link>
                      <Link to="/admin/artworks" style={styles.dropItem} onClick={() => setMenuOpen(false)}>
                        🖼️ Eser Yönetimi
                      </Link>
                      <Link to="/admin/analytics" style={styles.dropItem} onClick={() => setMenuOpen(false)}>
                        📈 Analitikler
                      </Link>
                    </>
                  )}
                  <hr style={styles.divider} />
                  <button style={styles.dropLogout} onClick={handleLogout}>
                    🚪 Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link to="/login" style={styles.loginBtn}>Giriş Yap</Link>
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
    padding: "0 32px", background: "#1a1a2e", color: "#fff",
    height: 60, position: "sticky", top: 0, zIndex: 1000,
    boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
  },
  left: { display: "flex", alignItems: "center", gap: 32 },
  brand: { color: "#e94560", textDecoration: "none", fontSize: 20, fontWeight: 800, whiteSpace: "nowrap" },
  navLinks: { display: "flex", gap: 24 },
  link: { color: "#aaa", textDecoration: "none", fontSize: 14, transition: "color 0.2s" },
  activeLink: { color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 600 },
  right: { display: "flex", alignItems: "center", gap: 16 },
  loginBtn: { color: "#aaa", textDecoration: "none", fontSize: 14 },
  registerBtn: {
    background: "#e94560", color: "#fff", textDecoration: "none",
    padding: "7px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600,
  },
  userMenu: { position: "relative" },
  userBtn: {
    display: "flex", alignItems: "center", gap: 8,
    background: "rgba(255,255,255,0.1)", border: "none", color: "#fff",
    padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 14,
  },
  avatar: {
    width: 28, height: 28, borderRadius: "50%", background: "#e94560",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    fontSize: 13, fontWeight: 700,
  },
  userName: { maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  dropdown: {
    position: "absolute", right: 0, top: "calc(100% + 8px)",
    background: "#fff", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
    minWidth: 200, zIndex: 1001, overflow: "hidden",
  },
  dropItem: {
    display: "block", padding: "12px 16px", color: "#333",
    textDecoration: "none", fontSize: 14,
    borderBottom: "1px solid #f5f5f5",
  },
  divider: { margin: 0, border: "none", borderTop: "1px solid #f0f0f0" },
  dropLogout: {
    display: "block", width: "100%", padding: "12px 16px",
    background: "none", border: "none", color: "#e74c3c",
    textAlign: "left", cursor: "pointer", fontSize: 14,
  },
  cartBadge: {
    position: "absolute", top: -6, right: -8,
    background: "#e94560", color: "#fff",
    borderRadius: "50%", width: 16, height: 16,
    fontSize: 10, fontWeight: 700,
    display: "inline-flex", alignItems: "center", justifyContent: "center",
  },
};
