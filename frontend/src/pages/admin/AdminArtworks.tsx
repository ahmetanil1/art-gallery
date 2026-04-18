import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { adminService } from "../../services/adminService";
import { artworkService } from "../../services/artworkService";

export default function AdminArtworks() {
  const [artworks, setArtworks] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editArtwork, setEditArtwork] = useState<any | null>(null);
  const [imageModal, setImageModal] = useState<any | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "", artist: "", category: "", description: "",
    year_created: "", medium: "", dimensions: "", price: "", status: "available",
  });

  const load = async () => {
    setLoading(true);
    try {
      const [aw, ar, cats] = await Promise.all([
        artworkService.list({ ordering: "-created_at" }).then((d) => d.results),
        artworkService.getArtists().then((d) => d.results ?? d),
        artworkService.getCategories().then((d) => d.results ?? d),
      ]);
      setArtworks(aw);
      setArtists(ar);
      setCategories(cats);
    } catch {
      toast.error("Veriler yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => setForm({ title: "", artist: "", category: "", description: "", year_created: "", medium: "", dimensions: "", price: "", status: "available" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editArtwork) {
        await adminService.updateArtwork(editArtwork.id, form);
        toast.success("Eser güncellendi.");
      } else {
        await adminService.createArtwork(form as any);
        toast.success("Eser oluşturuldu.");
      }
      setShowForm(false);
      setEditArtwork(null);
      resetForm();
      load();
    } catch (err: any) {
      const errors = err.response?.data;
      toast.error(errors ? Object.values(errors).flat().join(" ") : "İşlem başarısız.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bu eseri silmek istediğinizden emin misiniz?")) return;
    try {
      await adminService.deleteArtwork(id);
      toast.success("Eser silindi.");
      load();
    } catch {
      toast.error("Silinemedi.");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!imageModal || !e.target.files?.length) return;
    setUploadingImages(true);
    try {
      const formData = new FormData();
      Array.from(e.target.files).forEach((f) => formData.append("images", f));
      formData.append("is_primary", imageModal.images?.length === 0 ? "true" : "false");
      const result = await adminService.uploadImages(imageModal.id, formData);
      toast.success(`${result.count} görsel yüklendi.`);
      // Güncel eseri yeniden çek
      const updated = await fetch(`http://localhost:8000/api/admin/artworks/${imageModal.id}/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      }).then((r) => r.json());
      setImageModal(updated);
      load();
    } catch {
      toast.error("Görsel yüklenemedi.");
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!imageModal) return;
    try {
      await adminService.deleteImage(imageModal.id, imageId);
      toast.success("Görsel silindi.");
      const updated = await fetch(`http://localhost:8000/api/admin/artworks/${imageModal.id}/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      }).then((r) => r.json());
      setImageModal(updated);
      load();
    } catch {
      toast.error("Silinemedi.");
    }
  };

  const handleSetPrimary = async (imageId: number) => {
    if (!imageModal) return;
    try {
      await adminService.setPrimaryImage(imageModal.id, imageId);
      toast.success("Ana görsel güncellendi.");
      const updated = await fetch(`http://localhost:8000/api/admin/artworks/${imageModal.id}/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      }).then((r) => r.json());
      setImageModal(updated);
      load();
    } catch {
      toast.error("İşlem başarısız.");
    }
  };

  const statusColors: Record<string, string> = { available: "#27ae60", sold: "#e74c3c", reserved: "#f39c12", not_for_sale: "#95a5a6" };
  const statusLabels: Record<string, string> = { available: "Satışta", sold: "Satıldı", reserved: "Rezerve", not_for_sale: "Kapalı" };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>🖼️ Eser Yönetimi</h1>
        <button style={styles.addBtn} onClick={() => { setShowForm(true); setEditArtwork(null); resetForm(); }}>
          ➕ Yeni Eser Ekle
        </button>
      </div>

      {loading ? <div style={styles.loading}>Yükleniyor...</div> : (
        <div style={styles.grid}>
          {artworks.map((aw) => (
            <div key={aw.id} style={styles.card}>
              <div style={styles.cardImg}>
                {aw.primary_image
                  ? <img src={aw.primary_image} alt={aw.title} style={styles.img} />
                  : <span style={{ fontSize: 36 }}>🖼️</span>}
                <span style={{ ...styles.statusBadge, background: statusColors[aw.status] }}>
                  {statusLabels[aw.status]}
                </span>
              </div>
              <div style={styles.cardBody}>
                <h3 style={styles.cardTitle}>{aw.title}</h3>
                <p style={styles.cardMeta}>👨‍🎨 {aw.artist_name}</p>
                <p style={styles.cardPrice}>₺{Number(aw.price).toLocaleString()}</p>
                <div style={styles.cardActions}>
                  <button style={styles.imgBtn} onClick={() => setImageModal(aw)}>📷 Görseller</button>
                  <button style={styles.editBtn} onClick={() => {
                    setEditArtwork(aw);
                    setForm({ title: aw.title, artist: aw.artist, category: aw.category, description: aw.description || "", year_created: aw.year_created || "", medium: aw.medium || "", dimensions: aw.dimensions || "", price: aw.price, status: aw.status });
                    setShowForm(true);
                  }}>✏️</button>
                  <button style={styles.deleteBtn} onClick={() => handleDelete(aw.id)}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Eser Form Modal */}
      {showForm && (
        <div style={styles.overlay} onClick={() => setShowForm(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>{editArtwork ? "Eseri Düzenle" : "Yeni Eser Ekle"}</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGrid}>
                {[
                  { name: "title", label: "Başlık", required: true },
                  { name: "year_created", label: "Yapım Yılı" },
                  { name: "medium", label: "Teknik" },
                  { name: "dimensions", label: "Boyutlar" },
                  { name: "price", label: "Fiyat (₺)", required: true },
                ].map((f) => (
                  <div key={f.name}>
                    <label style={styles.label}>{f.label}</label>
                    <input
                      style={styles.input}
                      value={(form as any)[f.name]}
                      onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                      required={f.required}
                    />
                  </div>
                ))}
                <div>
                  <label style={styles.label}>Sanatçı</label>
                  <select style={styles.input} value={form.artist} onChange={(e) => setForm({ ...form, artist: e.target.value })} required>
                    <option value="">Seçin</option>
                    {artists.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Kategori</label>
                  <select style={styles.input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    <option value="">Seçin</option>
                    {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Durum</label>
                  <select style={styles.input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="available">Satışta</option>
                    <option value="not_for_sale">Satışa Kapalı</option>
                    <option value="reserved">Rezerve</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={styles.label}>Açıklama</label>
                <textarea style={{ ...styles.input, resize: "vertical" }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} required />
              </div>
              <div style={styles.formActions}>
                <button style={styles.saveBtn} type="submit">{editArtwork ? "Güncelle" : "Oluştur"}</button>
                <button style={styles.cancelBtn} type="button" onClick={() => setShowForm(false)}>İptal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Görsel Yönetimi Modal */}
      {imageModal && (
        <div style={styles.overlay} onClick={() => setImageModal(null)}>
          <div style={{ ...styles.modal, maxWidth: 700 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>📷 Görsel Yönetimi — {imageModal.title}</h2>
            <div style={styles.imageGrid}>
              {(imageModal.images || []).map((img: any) => (
                <div key={img.id} style={styles.imageItem}>
                  <img src={img.image_url || img.image} alt="" style={styles.thumbImg} />
                  {img.is_primary && <span style={styles.primaryBadge}>Ana</span>}
                  <div style={styles.imageActions}>
                    {!img.is_primary && (
                      <button style={styles.setPrimaryBtn} onClick={() => handleSetPrimary(img.id)}>⭐ Ana Yap</button>
                    )}
                    <button style={styles.deleteImgBtn} onClick={() => handleDeleteImage(img.id)}>🗑️</button>
                  </div>
                  <p style={styles.imagePath}>{img.image?.split("/").slice(-2).join("/")}</p>
                </div>
              ))}
            </div>
            <div style={styles.uploadArea}>
              <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
              <button style={styles.uploadBtn} onClick={() => fileInputRef.current?.click()} disabled={uploadingImages}>
                {uploadingImages ? "Yükleniyor..." : "📤 Görsel Yükle"}
              </button>
              <p style={styles.uploadHint}>JPG, PNG, WebP — Birden fazla seçebilirsiniz</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 1200, margin: "0 auto", padding: "24px 16px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { fontSize: 28, color: "#1a1a2e", margin: 0 },
  addBtn: { padding: "10px 20px", background: "#e94560", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 },
  loading: { textAlign: "center", padding: 60, color: "#999" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 },
  card: { background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
  cardImg: { position: "relative", height: 160, background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  img: { width: "100%", height: "100%", objectFit: "cover" },
  statusBadge: { position: "absolute", top: 8, right: 8, color: "#fff", fontSize: 11, padding: "2px 8px", borderRadius: 10, fontWeight: 600 },
  cardBody: { padding: 14 },
  cardTitle: { fontSize: 14, fontWeight: 700, color: "#1a1a2e", margin: "0 0 4px" },
  cardMeta: { fontSize: 12, color: "#888", margin: "0 0 4px" },
  cardPrice: { fontSize: 16, fontWeight: 700, color: "#e94560", margin: "0 0 10px" },
  cardActions: { display: "flex", gap: 6 },
  imgBtn: { flex: 1, padding: "6px", background: "#f0f4ff", border: "1px solid #c5d5ff", borderRadius: 6, cursor: "pointer", fontSize: 12 },
  editBtn: { padding: "6px 10px", background: "#fff9e6", border: "1px solid #ffe0a0", borderRadius: 6, cursor: "pointer", fontSize: 13 },
  deleteBtn: { padding: "6px 10px", background: "#fff0f0", border: "1px solid #ffc5c5", borderRadius: 6, cursor: "pointer", fontSize: 13 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 20 },
  modal: { background: "#fff", borderRadius: 16, padding: 32, width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" },
  modalTitle: { fontSize: 20, fontWeight: 700, color: "#1a1a2e", margin: "0 0 20px" },
  form: { display: "flex", flexDirection: "column", gap: 12 },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  label: { fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 },
  input: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, boxSizing: "border-box" as const },
  formActions: { display: "flex", gap: 10, marginTop: 8 },
  saveBtn: { flex: 1, padding: "12px", background: "#e94560", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600 },
  cancelBtn: { flex: 1, padding: "12px", background: "#f5f5f5", color: "#555", border: "none", borderRadius: 8, cursor: "pointer" },
  imageGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, marginBottom: 20 },
  imageItem: { background: "#f9f9f9", borderRadius: 8, overflow: "hidden", position: "relative" },
  thumbImg: { width: "100%", height: 120, objectFit: "cover", display: "block" },
  primaryBadge: { position: "absolute", top: 6, left: 6, background: "#f5a623", color: "#fff", fontSize: 10, padding: "2px 6px", borderRadius: 8, fontWeight: 700 },
  imageActions: { display: "flex", gap: 4, padding: "6px 8px" },
  setPrimaryBtn: { flex: 1, padding: "4px", background: "#fff9e6", border: "1px solid #ffe0a0", borderRadius: 4, cursor: "pointer", fontSize: 11 },
  deleteImgBtn: { padding: "4px 8px", background: "#fff0f0", border: "1px solid #ffc5c5", borderRadius: 4, cursor: "pointer", fontSize: 12 },
  imagePath: { fontSize: 10, color: "#aaa", padding: "0 8px 6px", wordBreak: "break-all" },
  uploadArea: { textAlign: "center", padding: "20px", background: "#f9f9f9", borderRadius: 10, border: "2px dashed #ddd" },
  uploadBtn: { padding: "10px 24px", background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 },
  uploadHint: { fontSize: 12, color: "#aaa", marginTop: 8 },
};
