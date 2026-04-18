import api from "../lib/axios";

export const adminService = {
  getDashboard: () => api.get("/admin/dashboard/").then((r) => r.data),
  getAnalytics: () => api.get("/admin/analytics/").then((r) => r.data),

  // Kullanıcı yönetimi
  getUsers: (params?: Record<string, string>) =>
    api.get("/admin/users/", { params }).then((r) => r.data),
  getUser: (id: number) => api.get(`/admin/users/${id}/`).then((r) => r.data),
  updateUser: (id: number, data: any) =>
    api.patch(`/admin/users/${id}/`, data).then((r) => r.data),
  toggleUserActive: (id: number) =>
    api.post(`/admin/users/${id}/toggle-active/`).then((r) => r.data),

  // Eser yönetimi
  createArtwork: (data: FormData) =>
    api.post("/admin/artworks/", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data),
  updateArtwork: (id: number, data: any) =>
    api.patch(`/admin/artworks/${id}/`, data).then((r) => r.data),
  deleteArtwork: (id: number) => api.delete(`/admin/artworks/${id}/`),
  uploadImages: (artworkId: number, formData: FormData) =>
    api.post(`/admin/artworks/${artworkId}/images/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data),
  deleteImage: (artworkId: number, imageId: number) =>
    api.delete(`/admin/artworks/${artworkId}/images/?image_id=${imageId}`).then((r) => r.data),
  setPrimaryImage: (artworkId: number, imageId: number) =>
    api.post(`/admin/artworks/${artworkId}/images/${imageId}/set-primary/`).then((r) => r.data),
};
