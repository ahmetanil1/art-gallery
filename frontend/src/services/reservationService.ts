import api from "../lib/axios";
import type { Reservation } from "../types";

export const reservationService = {
  list: () =>
    api.get<Reservation[]>("/reservations/").then((r) => r.data),

  create: (data: { event: number; participant_count: number; notes?: string }) =>
    api.post<Reservation>("/reservations/", data).then((r) => r.data),

  update: (id: number, data: { participant_count?: number; notes?: string }) =>
    api.patch<Reservation>(`/reservations/${id}/`, data).then((r) => r.data),

  cancel: (id: number, reason?: string) =>
    api.post(`/reservations/${id}/cancel/`, { reason }).then((r) => r.data),

  history: (id: number) =>
    api.get(`/reservations/${id}/history/`).then((r) => r.data),
};
