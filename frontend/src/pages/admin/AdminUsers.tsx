import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminService } from "../../services/adminService";
import { useAuthStore } from "../../store/authStore";

const ROLES = [
  { value: "customer", label: "Müşteri" },
  { value: "gallery_manager", label: "Galeri Yöneticisi" },
  { value: "admin", label: "Admin" },
];

export default function AdminUsers() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [editUser, setEditUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ role: "", is_active: true, is_verified: false });

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const data = await adminService.getUsers(params);
      setUsers(Array.isArray(data) ? data : data.results ?? []);
    } catch {
      toast.error("Kullanıcılar yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, roleFilter]);

  const handleToggleActive = async (userId: number) => {
    try {
      const result = await adminService.toggleUserActive(userId);
      toast.success(result.detail);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "İşlem başarısız.");
    }
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    try {
      await adminService.updateUser(editUser.id, editForm);
      toast.success("Kullanıcı güncellendi.");
      setEditUser(null);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Güncelleme başarısız.");
    }
  };

  const roleColor: Record<string, string> = {
    admin: "#e74c3c", gallery_manager: "#3498db", customer: "#27ae60",
  };
  const roleLabel: Record<string, string> = {
    admin: "Admin", gallery_manager: "Galeri Yöneticisi", customer: "Müşteri",
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>👥 Kullanıcı Yönetimi</h1>

      <div style={styles.filters}>
        <input
          style={styles.searchInput}
          placeholder="🔍 Ad, soyad veya e-posta ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select style={styles.select} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">Tüm Roller</option>
          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={styles.loading}>Yükleniyor...</div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>Kullanıcı</th>
                <th style={styles.th}>Rol</th>
                <th style={styles.th}>Sipariş</th>
                <th style={styles.th}>Rezervasyon</th>
                <th style={styles.th}>Durum</th>
                <th style={styles.th}>Kayıt Tarihi</th>
                <th style={styles.th}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={styles.userCell}>
                      <div style={{ ...styles.avatar, background: roleColor[u.role] || "#999" }}>
                        {u.first_name?.[0]?.toUpperCase() || u.email[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={styles.userName}>{u.first_name} {u.last_name}</div>
                        <div style={styles.userEmail}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={{ ...styles.roleBadge, background: roleColor[u.role] + "20", color: roleColor[u.role] }}>
                      {roleLabel[u.role] || u.role}
                    </span>
                  </td>
                  <td style={styles.td}>{u.order_count}</td>
                  <td style={styles.td}>{u.reservation_count}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.statusBadge, background: u.is_active ? "#eafaf1" : "#fdf2f2", color: u.is_active ? "#27ae60" : "#e74c3c" }}>
                      {u.is_active ? "✓ Aktif" : "✗ Pasif"}
                    </span>
                  </td>
                  <td style={styles.td}>{new Date(u.date_joined).toLocaleDateString("tr-TR")}</td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button
                        style={styles.editBtn}
                        onClick={() => { setEditUser(u); setEditForm({ role: u.role, is_active: u.is_active, is_verified: u.is_verified }); }}
                      >
                        ✏️
                      </button>
                      {u.id !== currentUser?.id && (
                        <button
                          style={{ ...styles.toggleBtn, background: u.is_active ? "#fff0f0" : "#eafaf1", color: u.is_active ? "#e74c3c" : "#27ae60" }}
                          onClick={() => handleToggleActive(u.id)}
                        >
                          {u.is_active ? "🚫" : "✓"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editUser && (
        <div style={styles.modalOverlay} onClick={() => setEditUser(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Kullanıcı Düzenle</h2>
            <p style={styles.modalSub}>{editUser.email}</p>

            <label style={styles.label}>Rol</label>
            <select
              style={styles.input}
              value={editForm.role}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value} disabled={r.value === "admin" && currentUser?.role !== "admin"}>
                  {r.label} {r.value === "admin" && currentUser?.role !== "admin" ? "(Sadece Admin)" : ""}
                </option>
              ))}
            </select>

            <div style={styles.checkRow}>
              <label style={styles.checkLabel}>
                <input type="checkbox" checked={editForm.is_active} onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })} />
                Aktif
              </label>
              <label style={styles.checkLabel}>
                <input type="checkbox" checked={editForm.is_verified} onChange={(e) => setEditForm({ ...editForm, is_verified: e.target.checked })} />
                Doğrulanmış
              </label>
            </div>

            <div style={styles.modalActions}>
              <button style={styles.saveBtn} onClick={handleEditSave}>Kaydet</button>
              <button style={styles.cancelBtn} onClick={() => setEditUser(null)}>İptal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 1200, margin: "0 auto", padding: "24px 16px" },
  title: { fontSize: 28, color: "#1a1a2e", marginBottom: 20 },
  filters: { display: "flex", gap: 12, marginBottom: 20 },
  searchInput: { flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14 },
  select: { padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, background: "#fff" },
  loading: { textAlign: "center", padding: 60, color: "#999" },
  tableWrap: { background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { background: "#f8f9fa" },
  th: { padding: "12px 16px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 },
  tr: { borderBottom: "1px solid #f5f5f5" },
  td: { padding: "12px 16px", fontSize: 14, color: "#333" },
  userCell: { display: "flex", alignItems: "center", gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: "50%", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 },
  userName: { fontWeight: 600, color: "#1a1a2e" },
  userEmail: { fontSize: 12, color: "#888" },
  roleBadge: { padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
  statusBadge: { padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
  actions: { display: "flex", gap: 6 },
  editBtn: { padding: "6px 10px", background: "#f0f4ff", border: "1px solid #c5d5ff", borderRadius: 6, cursor: "pointer", fontSize: 13 },
  toggleBtn: { padding: "6px 10px", border: "1px solid #ddd", borderRadius: 6, cursor: "pointer", fontSize: 13 },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 },
  modal: { background: "#fff", borderRadius: 16, padding: 32, width: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" },
  modalTitle: { fontSize: 20, fontWeight: 700, color: "#1a1a2e", margin: "0 0 4px" },
  modalSub: { fontSize: 13, color: "#888", margin: "0 0 20px" },
  label: { fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 },
  input: { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, marginBottom: 16, boxSizing: "border-box" as const },
  checkRow: { display: "flex", gap: 20, marginBottom: 20 },
  checkLabel: { display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" },
  modalActions: { display: "flex", gap: 10 },
  saveBtn: { flex: 1, padding: "12px", background: "#e94560", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 },
  cancelBtn: { flex: 1, padding: "12px", background: "#f5f5f5", color: "#555", border: "none", borderRadius: 8, cursor: "pointer" },
};
