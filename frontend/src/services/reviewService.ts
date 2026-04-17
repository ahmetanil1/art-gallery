import api from "../lib/axios";

export const reviewService = {
  getArtworkReviews: (artworkId: number, ordering?: string) =>
    api
      .get("/artwork-reviews/", { params: { artwork: artworkId, ordering } })
      .then((r) => r.data),

  createArtworkReview: (data: { artwork: number; rating: number; comment: string }) =>
    api.post("/artwork-reviews/", data).then((r) => r.data),

  getEventReviews: (eventId: number, ordering?: string) =>
    api
      .get("/event-reviews/", { params: { event: eventId, ordering } })
      .then((r) => r.data),

  createEventReview: (data: { event: number; rating: number; comment: string }) =>
    api.post("/event-reviews/", data).then((r) => r.data),

  voteArtworkReview: (reviewId: number, vote: "helpful" | "not_helpful") =>
    api.post(`/artwork-reviews/${reviewId}/vote/`, { vote }).then((r) => r.data),

  replyToReview: (reviewId: number, type: "artwork" | "event", replyText: string) => {
    const url =
      type === "artwork"
        ? `/artwork-reviews/${reviewId}/reply/`
        : `/event-reviews/${reviewId}/reply/`;
    return api.post(url, { reply_text: replyText }).then((r) => r.data);
  },
};
