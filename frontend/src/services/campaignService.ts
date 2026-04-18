import api from "../lib/axios";
import type { Campaign } from "../types";

export const campaignService = {
  list: (activeOnly = false) =>
    api.get<Campaign[]>("/campaigns/", {
      params: activeOnly ? { active: "true" } : {},
    }).then((r) => r.data),

  validateCoupon: (code: string) =>
    api.post("/campaigns/validate_coupon/", { code }).then((r) => r.data),
};
