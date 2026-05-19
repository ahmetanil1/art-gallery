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

  // Etkinlik yönetimi
  getEvents: (params?: Record<string, string>) =>
    api.get("/events/", { params }).then((r) => r.data),
  getEventCategories: () =>
    api.get("/event-categories/").then((r) => r.data),
  createEvent: (data: any) =>
    api.post("/events/", data).then((r) => r.data),
  updateEvent: (id: number, data: any) =>
    api.patch(`/events/${id}/`, data).then((r) => r.data),
  deleteEvent: (id: number) =>
    api.delete(`/events/${id}/`),

  // Rezervasyon yönetimi
  getAllReservations: (params?: Record<string, string>) =>
    api.get("/reservations/", { params }).then((r) => r.data),
  confirmReservation: (id: number) =>
    api.patch(`/reservations/${id}/`, { status: "confirmed" }).then((r) => r.data),
  cancelReservation: (id: number) =>
    api.post(`/reservations/${id}/cancel/`, {}).then((r) => r.data),
};
