import * as mock from "./marketApi";
import { axiosClient } from "../api/axiosClient";

export const promoteAd = async (adId, promoType) => {
  try {
    const { data } = await axiosClient.post("/market/promote", {
      ad_id: adId,
      promo_type: promoType,
    });
    return data;
  } catch (err) {
    console.error("Promote Error:", err);
    if (mock.promoteAd) return mock.promoteAd(adId, promoType);
    throw new Error(err.response?.data?.message || "Balans yetarli emas yoki tizim xatosi");
  }
};

export const revealSellerPhone = async (adId) => {
  try {
    const { data } = await axiosClient.post("/market/reveal-phone", { ad_id: adId });
    return data;
  } catch (err) {
    console.error("Reveal Phone Error:", err);
    throw new Error(err.response?.data?.message || "402");
  }
};

export async function getWalletBalance() {
  try {
    const { data } = await axiosClient.get("/wallet");
    if (typeof data === "number") return data;
    return data?.wallet?.balance_uzs ?? data?.balance ?? 0;
  } catch (err) {
    console.error("Wallet Balance Fetch Error:", err);
    return 0;
  }
}

export async function createPayment({ provider = "demo", amount_uzs, return_url } = {}) {
  const { data } = await axiosClient.post(`/auto-market/payment/create`, { provider, amount_uzs, return_url });
  return data;
}

export async function buyPromotion({ ad_id, promo_type } = {}) {
  const { data } = await axiosClient.post(`/auto-market/promo/buy`, { ad_id, promo_type });
  return data;
}

export async function revealPhone({ ad_id } = {}) {
  const { data } = await axiosClient.post(`/auto-market/contact/reveal`, { ad_id });
  return data;
}
