import api from "../lib/axios";
import type { Event, PaginatedResponse } from "../types";

export const eventService = {
  list: (params?: Record<string, string>) =>
    api.get<PaginatedResponse<Event>>("/events/", { params }).then((r) => r.data),

  detail: (id: number) =>
    api.get<Event>(`/events/${id}/`).then((r) => r.data),

  getCategories: () =>
    api.get("/event-categories/").then((r) => r.data),
};
