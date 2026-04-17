import api from "../lib/axios";

export const supportService = {
  list: () => api.get("/support/").then((r) => r.data),

  create: (data: { subject: string; category: string }) =>
    api.post("/support/", data).then((r) => r.data),

  detail: (id: number) =>
    api.get(`/support/${id}/`).then((r) => r.data),

  sendMessage: (ticketId: number, message: string) =>
    api
      .post(`/support/${ticketId}/send_message/`, { message })
      .then((r) => r.data),
};
