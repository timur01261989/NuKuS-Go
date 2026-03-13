/**
 * AUTO MARKET BACKEND (Supabase-first, mock fallback)
 *
 * Maqsad:
 *  - Avto savdo modulini real Supabase backend bilan ishlaydigan qilish.
 *  - Agar Supabase ENV yo'q yoki jadval hali yaratilmagan bo'lsa — eski mock (marketApi.js) ishlashda davom etadi.
 *
 * Cheklov:
 *  - Bu fayl faqat auto-market ichida ishlatiladi (boshqa xizmatlarga tegilmagan).
 */

import { supabase } from "@/services/supabase/supabaseClient.js";
import * as mock from "./marketApi";
import { axiosClient } from "../api/axiosClient";

const SB_READY =
  !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;

function isMissingRelationError(err) {
  const msg = (err && (err.message || err.error_description || err.details)) || "";
  return (
    String(msg).toLowerCase().includes("does not exist") ||
    String(msg).toLowerCase().includes("relation") ||
    String(msg).toLowerCase().includes("42p01")
  );
}

async function getAuthUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data?.user?.id || null;
}

function normalizeAdRow(row) {
  if (!row) return row;
  const images = (row.images || []).map((x) => x.url || x.image_url).filter(Boolean);
  return {
    ...row,
    images,
    seller: row.seller || {
      name: row.seller_name || "",
      phone: row.seller_phone || "",
      rating: row.seller_rating || null,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Cars / Ads
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// YANGI: PUL BILAN BOG'LIQ XIZMATLAR (PROMOTE, PHONE, WALLET)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * E'lonni ko'tarish (Promotion) - PromoModal ishlatadi
 */
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

/**
 * Sotuvchi telefon raqamini ko'rish (Pullik xizmat)
 */
export const revealSellerPhone = async (adId) => {
  try {
    const { data } = await axiosClient.post("/market/reveal-phone", { ad_id: adId });
    return data;
  } catch (err) {
    console.error("Reveal Phone Error:", err);
    throw new Error(err.response?.data?.message || "402");
  }
};

/**
 * Foydalanuvchi hamyon balansini olish
 */
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

// ─────────────────────────────────────────────────────────────────────────────
// YANGI QO'SHILGAN FUNKSIYALAR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * updateGarajItem - Garajdagi mashina ma'lumotlarini yangilash
 * (Sug'urta muddati, yurgan yo'li va h.k.)
 */
export const updateGarajItem = async (adId, updates) => {
  if (!SB_READY) {
    const current = JSON.parse(localStorage.getItem("my_garaj") || "[]");
    const newList = current.map((item) =>
      String(item.ad_id) === String(adId) ? { ...item, ...updates } : item
    );
    localStorage.setItem("my_garaj", JSON.stringify(newList));
    return newList;
  }

  const uid = await getAuthUserId();
  if (!uid) throw new Error("Garajni yangilash uchun avval tizimga kiring");

  try {
    const { error } = await supabase
      .from("auto_garaj")
      .update(updates)
      .eq("user_id", uid)
      .eq("ad_id", adId);

    if (error) throw error;
    return getGaraj();
  } catch (err) {
    console.error("Garajni yangilashda xato:", err);
    if (isMissingRelationError(err)) {
      const current = JSON.parse(localStorage.getItem("my_garaj") || "[]");
      const newList = current.map((item) =>
        String(item.ad_id) === String(adId) ? { ...item, ...updates } : item
      );
      localStorage.setItem("my_garaj", JSON.stringify(newList));
      return newList;
    }
    throw err;
  }
};

export async function listCars(filters = {}, { page = 1, pageSize = 12 } = {}) {
  if (!SB_READY) return mock.listCars(filters, { page, pageSize });

  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let q = supabase
      .from("auto_market_ads")
      .select("*, images:auto_market_images(image_url, sort_order)", { count: "exact" })
      .in("status", ["active", "pending_review", "pending_payment"])
      .order("is_top", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);

    const qq = (filters.q || "").trim();
    if (qq) {
      q = q.or(
        `title.ilike.%${qq}%,brand.ilike.%${qq}%,model.ilike.%${qq}%,city.ilike.%${qq}%`
      );
    }

    if (filters.city) q = q.eq("city", filters.city);
    if (filters.brand) q = q.eq("brand", filters.brand);
    if (filters.model) q = q.eq("model", filters.model);
    if (filters.yearFrom) q = q.gte("year", Number(filters.yearFrom));
    if (filters.yearTo) q = q.lte("year", Number(filters.yearTo));
    if (filters.minPrice) q = q.gte("price_uzs", Number(filters.minPrice));
    if (filters.maxPrice) q = q.lte("price_uzs", Number(filters.maxPrice));
    if (filters.kredit) q = q.eq("is_credit", true);
    if (filters.exchange) q = q.eq("is_exchange", true);

    switch (filters.sort) {
      case "cheap":
        q = q.order("price_uzs", { ascending: true });
        break;
      case "expensive":
        q = q.order("price_uzs", { ascending: false });
        break;
      case "year_new":
        q = q.order("year", { ascending: false });
        break;
      default:
        break;
    }

    const { data, error, count } = await q;
    if (error) throw error;

    return { items: (data || []).map(normalizeAdRow), total: count || 0, page, pageSize };
  } catch (e) {
    if (isMissingRelationError(e)) return mock.listCars(filters, { page, pageSize });
    throw new Error(e?.message || "Auto Market: listCars xatosi");
  }
}

export async function getCarById(id) {
  if (!SB_READY) return mock.getCarById(id);

  try {
    const uid = await getAuthUserId();
    await supabase.rpc("auto_market_inc_view", { p_ad_id: id }).catch(() => {});

    const { data, error } = await supabase
      .from("auto_market_ads")
      .select("*, images:auto_market_images(image_url, sort_order)")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("E'lon topilmadi");

    const row = normalizeAdRow(data);
    const is_owner = uid && String(row.owner_user_id || row.user_id) === String(uid);
    return {
      ...row,
      is_owner,
      seller: {
        ...(row.seller || {}),
        phone: is_owner ? (row?.seller?.phone || row.seller_phone || null) : null,
      },
    };
  } catch (e) {
    if (isMissingRelationError(e)) return mock.getCarById(id);
    throw new Error(e?.message || "Auto Market: getCarById xatosi");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Wallet / Payments / Paid actions (server-side)
// ─────────────────────────────────────────────────────────────────────────────

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

export async function createCarAd(draft) {
  if (!SB_READY) return mock.createCarAd(draft);

  const uid = await getAuthUserId();
  if (!uid) throw new Error("E'lon joylash uchun avval tizimga kiring");

  try {
    const now = new Date().toISOString();
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { count: dailyCount } = await supabase
      .from("auto_market_ads")
      .select("id", { count: "exact", head: true })
      .eq("owner_user_id", uid)
      .gte("created_at", dayAgo);

    if ((dailyCount || 0) >= 10) throw new Error("Bir kunda 10 tadan ko'p e'lon joylab bo'lmaydi");

    const phone = draft?.seller?.phone || draft?.seller_phone || "";
    const vin = (draft?.vin || "").trim();
    const title = (draft?.title || "").trim();
    if (phone && (vin || title)) {
      let dupQ = supabase
        .from("auto_market_ads")
        .select("id", { count: "exact", head: true })
        .eq("seller_phone", phone);
      if (vin) dupQ = dupQ.eq("vin", vin);
      if (!vin && title) dupQ = dupQ.ilike("title", title);
      const { count: dupCount } = await dupQ;
      if ((dupCount || 0) > 0) throw new Error("Dublikat e'lon: shu telefon bilan shu ma'lumotlar allaqachon bor");
    }

    const payload = {
      owner_user_id: uid,
      title: title || `${draft.brand || ""} ${draft.model || ""}`.trim(),
      brand: draft.brand || null,
      model: draft.model || null,
      year: draft.year ? Number(draft.year) : null,
      mileage_km: draft.mileage !== undefined ? Number(draft.mileage) : null,
      price_uzs: draft.price ? Number(draft.price) : null,
      currency_code: draft.currency || "UZS",
      city: draft.city || null,
      location: draft.location || null,
      fuel_type: draft.fuel_type || null,
      transmission: draft.transmission || null,
      color: draft.color || null,
      body_type: draft.body_type || null,
      drive_type: draft.drive_type || null,
      engine: draft.engine || null,
      description: draft.description || null,
      vin: vin || null,
      is_credit: !!draft.kredit,
      is_exchange: !!draft.exchange,
      comfort: draft.comfort || null,
      status: "pending",
      is_top: !!draft.is_top,
      views_count: 0,
      seller_name: draft?.seller?.name || draft?.seller_name || null,
      seller_phone: phone || null,
      seller_rating: draft?.seller?.rating || draft?.seller_rating || null,
      created_at: now,
      updated_at: now,
    };

    const { data: inserted, error } = await supabase
      .from("auto_market_ads")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;

    const images = (draft.images || [])
      .map((x) => (typeof x === "string" ? x : x?.url))
      .filter(Boolean);

    if (images.length) {
      const rows = images.map((url, idx) => ({ ad_id: inserted.id, image_url: url, sort_order: idx }));
      await supabase.from("auto_market_images").insert(rows);
    }

    if (payload.price_uzs) {
      await supabase
        .from("auto_price_history")
        .insert({ ad_id: inserted.id, at: now, price: payload.price_uzs, currency: payload.currency_code });
    }

    return normalizeAdRow({ ...inserted, images: images.map((url, idx) => ({ image_url: url, sort_order: idx })) });
  } catch (e) {
    if (isMissingRelationError(e)) return mock.createCarAd(draft);
    throw new Error(e?.message || "Auto Market: createCarAd xatosi");
  }
}

export async function myAds() {
  if (!SB_READY) return mock.myAds();
  const uid = await getAuthUserId();
  if (!uid) return [];

  try {
    const { data, error } = await supabase
      .from("auto_market_ads")
      .select("*, images:auto_market_images(image_url, sort_order)")
      .eq("owner_user_id", uid)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(normalizeAdRow);
  } catch (e) {
    if (isMissingRelationError(e)) return mock.myAds();
    throw new Error(e?.message || "Auto Market: myAds xatosi");
  }
}

export async function markAdStatus(id, status) {
  if (!SB_READY) return mock.markAdStatus(id, status);

  try {
    const { data, error } = await supabase
      .from("auto_market_ads")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return normalizeAdRow(data);
  } catch (e) {
    if (isMissingRelationError(e)) return mock.markAdStatus(id, status);
    throw new Error(e?.message || "Auto Market: markAdStatus xatosi");
  }
}

export async function priceHistory(adId) {
  if (!SB_READY) return mock.priceHistory(adId);

  try {
    const { data, error } = await supabase
      .from("auto_price_history")
      .select("at, price, currency")
      .eq("ad_id", adId)
      .order("at", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (e) {
    if (isMissingRelationError(e)) return mock.priceHistory(adId);
    throw new Error(e?.message || "Auto Market: priceHistory xatosi");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Favorites
// ─────────────────────────────────────────────────────────────────────────────

export async function getFavorites() {
  if (!SB_READY) return mock.getFavorites();
  const uid = await getAuthUserId();
  if (!uid) return new Set();

  try {
    const { data, error } = await supabase
      .from("auto_market_favorites")
      .select("ad_id")
      .eq("user_id", uid);

    if (error) throw error;
    return new Set((data || []).map((x) => String(x.ad_id)));
  } catch (e) {
    if (isMissingRelationError(e)) return mock.getFavorites();
    throw new Error(e?.message || "Auto Market: getFavorites xatosi");
  }
}

export async function toggleFavorite(adId) {
  if (!SB_READY) return mock.toggleFavorite(adId);
  const uid = await getAuthUserId();
  if (!uid) throw new Error("Sevimlilarga qo'shish uchun avval tizimga kiring");

  try {
    const { data: existing, error: exErr } = await supabase
      .from("auto_market_favorites")
      .select("id")
      .eq("user_id", uid)
      .eq("ad_id", adId)
      .maybeSingle();

    if (exErr) throw exErr;

    if (existing?.id) {
      const { error } = await supabase.from("auto_market_favorites").delete().eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("auto_market_favorites").insert({ user_id: uid, ad_id: adId });
      if (error) throw error;
    }

    return Array.from(await getFavorites());
  } catch (e) {
    if (isMissingRelationError(e)) return mock.toggleFavorite(adId);
    throw new Error(e?.message || "Auto Market: toggleFavorite xatosi");
  }
}

export async function listFavoriteCars(filters = {}) {
  if (!SB_READY) return mock.listFavoriteCars(filters);
  const uid = await getAuthUserId();
  if (!uid) return [];

  try {
    const { data: favs, error: fErr } = await supabase
      .from("auto_market_favorites")
      .select("ad_id")
      .eq("user_id", uid);

    if (fErr) throw fErr;
    const ids = (favs || []).map((x) => x.ad_id);
    if (!ids.length) return [];

    let q = supabase
      .from("auto_market_ads")
      .select("*, images:auto_market_images(image_url, sort_order)")
      .in("id", ids)
      .order("created_at", { ascending: false });

    const qq = (filters.q || "").trim();
    if (qq) q = q.or(`title.ilike.%${qq}%,brand.ilike.%${qq}%,model.ilike.%${qq}%`);
    if (filters.city) q = q.eq("city", filters.city);
    if (filters.brand) q = q.eq("brand", filters.brand);
    if (filters.model) q = q.eq("model", filters.model);

    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map(normalizeAdRow);
  } catch (e) {
    if (isMissingRelationError(e)) return mock.listFavoriteCars(filters);
    throw new Error(e?.message || "Auto Market: listFavoriteCars xatosi");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Garaj
// ─────────────────────────────────────────────────────────────────────────────

export async function getGaraj() {
  if (!SB_READY) return mock.getGaraj();
  const uid = await getAuthUserId();
  if (!uid) return [];

  try {
    const { data, error } = await supabase
      .from("auto_garaj")
      .select("*")
      .eq("user_id", uid)
      .order("added_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (e) {
    if (isMissingRelationError(e)) return mock.getGaraj();
    throw new Error(e?.message || "Auto Market: getGaraj xatosi");
  }
}

export async function addToGaraj(ad) {
  if (!SB_READY) return mock.addToGaraj(ad);
  const uid = await getAuthUserId();
  if (!uid) throw new Error("Garaj uchun avval tizimga kiring");

  try {
    const { error } = await supabase
      .from("auto_garaj")
      .insert({
        owner_user_id: uid,
        ad_id: ad.id,
        brand: ad.brand,
        model: ad.model,
        year: ad.year,
        price_at_add: ad.price,
        current_price: ad.price,
        currency: ad.currency || "UZS",
        image_url: ad.images?.[0] || null,
        notify_price_drop: true,
      });

    if (error) {
      const msg = String(error.message || "").toLowerCase();
      if (!msg.includes("duplicate") && !msg.includes("unique")) throw error;
    }
    return await getGaraj();
  } catch (e) {
    if (isMissingRelationError(e)) return mock.addToGaraj(ad);
    throw new Error(e?.message || "Auto Market: addToGaraj xatosi");
  }
}

export async function removeFromGaraj(adId) {
  if (!SB_READY) return mock.removeFromGaraj(adId);
  const uid = await getAuthUserId();
  if (!uid) return [];

  try {
    const { error } = await supabase
      .from("auto_garaj")
      .delete()
      .eq("user_id", uid)
      .eq("ad_id", adId);

    if (error) throw error;
    return await getGaraj();
  } catch (e) {
    if (isMissingRelationError(e)) return mock.removeFromGaraj(adId);
    throw new Error(e?.message || "Auto Market: removeFromGaraj xatosi");
  }
}

export async function isInGaraj(adId) {
  if (!SB_READY) return mock.isInGaraj(adId);
  const uid = await getAuthUserId();
  if (!uid) return false;

  try {
    const { data, error } = await supabase
      .from("auto_garaj")
      .select("id")
      .eq("user_id", uid)
      .eq("ad_id", adId)
      .maybeSingle();

    if (error) throw error;
    return !!data?.id;
  } catch (e) {
    if (isMissingRelationError(e)) return mock.isInGaraj(adId);
    throw new Error(e?.message || "Auto Market: isInGaraj xatosi");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ServiceBook
// ─────────────────────────────────────────────────────────────────────────────

export async function getServiceBooks() {
  if (!SB_READY) return mock.getServiceBooks();
  const uid = await getAuthUserId();
  if (!uid) return [];

  try {
    const { data, error } = await supabase
      .from("auto_service_books")
      .select("*, records:auto_service_records(*)")
      .eq("user_id", uid)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (e) {
    if (isMissingRelationError(e)) return mock.getServiceBooks();
    throw new Error(e?.message || "Auto Market: getServiceBooks xatosi");
  }
}

export async function createServiceBook(data) {
  if (!SB_READY) return mock.createServiceBook(data);
  const uid = await getAuthUserId();
  if (!uid) throw new Error("Daftar yaratish uchun avval tizimga kiring");

  try {
    const now = new Date().toISOString();
    const { data: book, error } = await supabase
      .from("auto_service_books")
      .insert({ owner_user_id: uid, ...data, created_at: now, updated_at: now })
      .select("*")
      .single();

    if (error) throw error;
    return { ...book, records: [] };
  } catch (e) {
    if (isMissingRelationError(e)) return mock.createServiceBook(data);
    throw new Error(e?.message || "Auto Market: createServiceBook xatosi");
  }
}

export async function addServiceRecord(bookId, record) {
  if (!SB_READY) return mock.addServiceRecord(bookId, record);

  try {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("auto_service_records")
      .insert({ book_id: bookId, ...record, created_at: now });

    if (error) throw error;

    await supabase
      .from("auto_service_books")
      .update({ updated_at: now, current_mileage: record.current_mileage || null })
      .eq("id", bookId);

    const books = await getServiceBooks();
    return books.find((b) => String(b.id) === String(bookId)) || null;
  } catch (e) {
    if (isMissingRelationError(e)) return mock.addServiceRecord(bookId, record);
    throw new Error(e?.message || "Auto Market: addServiceRecord xatosi");
  }
}

export async function updateServiceBook(bookId, data) {
  if (!SB_READY) return mock.updateServiceBook(bookId, data);

  try {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("auto_service_books")
      .update({ ...data, updated_at: now })
      .eq("id", bookId);

    if (error) throw error;
    const books = await getServiceBooks();
    return books.find((b) => String(b.id) === String(bookId)) || null;
  } catch (e) {
    if (isMissingRelationError(e)) return mock.updateServiceBook(bookId, data);
    throw new Error(e?.message || "Auto Market: updateServiceBook xatosi");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Qo'shimcha bo'limlar hozircha mock (UI buzilmasin).
// SQL faylda ular uchun ham jadval skeleti bor.
// ─────────────────────────────────────────────────────────────────────────────

export const getVikupByAdId = (...a) => mock.getVikupByAdId?.(...a);
export const createVikup = (...a) => mock.createVikup?.(...a);
export const listVikupAds = (...a) => mock.listVikupAds?.(...a);

export const createBarterOffer = (...a) => mock.createBarterOffer?.(...a);
export const listBarterAds = (...a) => mock.listBarterAds?.(...a);
export const listBarterAdsByOfferModel = (...a) => mock.listBarterAdsByOfferModel?.(...a);

export const listZapchast = (...a) => mock.listZapchast?.(...a);
export const createZapchastAd = (...a) => mock.createZapchastAd?.(...a);

export const listBattles = (...a) => mock.listBattles?.(...a);
export const getBattleById = (...a) => mock.getBattleById?.(...a);
export const voteBattle = (...a) => mock.voteBattle?.(...a);

export const analyzeFairPrice = (...a) => mock.analyzeFairPrice?.(...a);

// ─────────────────────────────────────────────────────────────────────────────
// Backward-compatible aliases (old proxy layer)
// ─────────────────────────────────────────────────────────────────────────────

export function getCarList(params = {}) {
  const filters = params.filters ?? params;
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 12;
  return listCars(filters, { page, pageSize });
}

export function getCarDetails(id) {
  return getCarById(id);
}

const marketBackend = {
  listCars,
  getCarList,
  getCarById,
  getCarDetails,
  createCarAd,
  myAds,
  markAdStatus,
  priceHistory,
  promoteAd,
  revealSellerPhone,
  getWalletBalance,
  createPayment,
  buyPromotion,
  revealPhone,
  getFavorites,
  toggleFavorite,
  listFavoriteCars,
  getGaraj,
  addToGaraj,
  removeFromGaraj,
  isInGaraj,
  updateGarajItem,
  getServiceBooks,
  createServiceBook,
  addServiceRecord,
  updateServiceBook,
  getVikupByAdId,
  createVikup,
  listVikupAds,
  createBarterOffer,
  listBarterAds,
  listBarterAdsByOfferModel,
  listZapchast,
  createZapchastAd,
  listBattles,
  getBattleById,
  voteBattle,
  analyzeFairPrice,
};

export default marketBackend;
