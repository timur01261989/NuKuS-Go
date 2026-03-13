import api from "@/modules/shared/utils/apiHelper";
import { estimateDistrictPrice } from "./districtData";

/**
 * districtApi.js
 * -------------------------------------------------------
 * Serverdan haydovchilarni olish (offers).
 *
 * Backend action:
 * - GET/POST /api/order?action=district_offers  (yoki POST {action:"district_offers"})
 *
 * Agar backend hali tayyor bo‘lmasa ham UI ishlashi uchun,
 * xatoda avtomatik "takliflar" generatsiya qilinadi (masofa asosida).
 */

function makeFallbackOffers({ distanceKm = 10, filters = {} }) {
  const base = estimateDistrictPrice(distanceKm);
  const cars = [
    { carModel: "Cobalt", carNumber: "95A 123 AB" },
    { carModel: "Gentra", carNumber: "90B 777 BB" },
    { carModel: "Nexia 3", carNumber: "01C 555 CC" },
    { carModel: "Lacetti", carNumber: "85D 888 DD" },
  ];
  const names = ["Aziz", "Sardor", "Diyor", "Javohir", "Rustam", "Ibrohim"];

  const list = cars.map((c, i) => {
    const ac = i % 2 === 0;
    const trunk = i % 3 === 0;
    const price = base + i * 2500;
    return {
      id: `fb_${i}`,
      driverId: `fb_driver_${i}`,
      driverName: names[i % names.length],
      rating: 4.5 + (i % 5) * 0.1,
      carModel: c.carModel,
      carNumber: c.carNumber,
      ac,
      trunk,
      price,
      etaMin: Math.max(3, Math.round((distanceKm / 50) * 60 * 0.3) + i),
      
      // ==========================================
      // YANGI: "Yagona Reys" uchun qo'shilgan Fallback ma'lumotlar 
      // (Bular TripCard.jsx da chiroyli ko'rinishi uchun kerak)
      // ==========================================
      car_model: c.carModel, // TripCard dagi nomlanishga moslashtirildi
      driver_rating: (4.5 + (i % 5) * 0.1).toFixed(1),
      base_price_uzs: price,
      tariff: i % 2 === 0 ? "door" : "pitak",
      has_delivery: i % 2 !== 0, // Ba'zilarida pochta bor
      female_only: i === 3, // Bitta reysni faqat ayollar uchun qilib sinab ko'ramiz
      seats_total: 4,
      depart_at: new Date(Date.now() + i * 3600000).toISOString(),
    };
  });

  // Apply filters locally
  return list.filter((o) => {
    if (filters.ac && !o.ac) return false;
    if (filters.trunk && !o.trunk) return false;
    // YANGI: Ayollar filtri bosilgan bo'lsa
    if (filters.femaleOnly && !o.female_only) return false;
    return true;
  });
}

export async function listDistrictOffers({ fromDistrict, toDistrict, distanceKm, filters }) {
  try {
    const res = await api.post("/api/order", {
      action: "district_offers",
      fromDistrict,
      toDistrict,
      filters,
    });

    const offers = res?.offers || res?.data?.offers || res?.data || [];
    if (Array.isArray(offers) && offers.length) return offers;
  } catch (e) {
    // ignore; fallback below
  }
  return makeFallbackOffers({ distanceKm, filters });
}

export async function createInterDistrictOrder(payload) {
  // Eski payload izohi: payload: { fromDistrict, toDistrict, seats, price, distance_km, departureTime, selectedOfferId? }
  // YANGI payload izohi: Yuqoridagilarga qo'shimcha ravishda 'weight_category', 'payment_method', 'final_price', 'is_delivery' ham yuboriladi.
  return api.post("/api/order", { action: "create_inter_district", ...payload });
}

// =========================================================================
// YANGI QO'SHILGAN "AQLLI TIZIM" API FUNKSIYALARI (Yagona Reys uchun)
// =========================================================================

/**
 * 1. GPS Monitoring (Jonli harakat)
 * Xaritada haydovchi qayerda kelyapti va qancha vaqtda yetib kelishini (ETA) bazadan so'rash.
 * DistrictMap.jsx dagi setInterval ichida ishlatiladi.
 */
export async function getDriverLiveLocation(tripId, driverId) {
  try {
    const res = await api.get(`/api/tracking/live`, { 
      params: { tripId, driverId } 
    });
    // Kutilayotgan javob formati: { lat: 42.123, lng: 59.456, eta: 5 }
    return res?.data || null; 
  } catch (e) {
    console.error("GPS lokatsiyani olishda xatolik:", e);
    return null;
  }
}

/**
 * 2. Safarni Bekor Qilish (Firibgarlikni tekshirish qalqoni bilan)
 * Agar haydovchi yoki yo'lovchi safarni bekor qilsa, ularning jonli GPS koordinatalari
 * birga yuboriladi. Backend ularning birga ketayotgani yoki yo'qligini tekshiradi.
 */
export async function cancelTripWithFraudCheck(payload) {
  // payload: { tripId, reason, clientLocation: {lat, lng}, driverLocation: {lat, lng} }
  try {
    const res = await api.post("/api/order", { 
      action: "cancel_with_fraud_check", 
      ...payload 
    });
    return res?.data; // { isFraud: boolean, penaltyApplied: boolean, refundStatus: "..." }
  } catch (e) {
    console.error("Bekor qilishda xatolik yuz berdi:", e);
    throw e;
  }
}

/**
 * 3. Hamyon / Komissiya (To'lovni tasdiqlash)
 * Agar mijoz "Karta orqali" to'lov tanlagan bo'lsa, pulni muzlatish yoki o'tkazish.
 */
export async function processTripPayment(payload) {
  // payload: { tripId, amount, paymentMethod: 'card' | 'cash' }
  try {
    const res = await api.post("/api/payment/process", { 
      action: "process_trip_payment", 
      ...payload 
    });
    return res?.data;
  } catch (e) {
    console.error("To'lovni tasdiqlashda xatolik:", e);
    throw e;
  }
}