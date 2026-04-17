import api from "../lib/axios";
import type { Artwork, PaginatedResponse } from "../types";

export const artworkService = {
  list: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<Artwork>>("/artworks/", { params }).then((r) => r.data),

  detail: (id: number) =>
    api.get<Artwork>(`/artworks/${id}/`).then((r) => r.data),

  addFavorite: (artworkId: number) =>
    api.post("/favorites/", { artwork_id: artworkId }).then((r) => r.data),

  removeFavorite: (favoriteId: number) =>
    api.delete(`/favorites/${favoriteId}/`),

  getFavorites: () =>
    api.get("/favorites/").then((r) => r.data),

  getArtists: () =>
    api.get("/artists/").then((r) => r.data),

  getCategories: () =>
    api.get("/categories/").then((r) => r.data),

  getStats: () =>
    api.get("/artworks/stats/").then((r) => r.data),
};
