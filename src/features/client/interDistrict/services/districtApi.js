import api from "@/utils/apiHelper";
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
    };
  });

  // Apply filters locally
  return list.filter((o) => {
    if (filters.ac && !o.ac) return false;
    if (filters.trunk && !o.trunk) return false;
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
  // payload: { fromDistrict, toDistrict, seats, price, distance_km, departureTime, selectedOfferId? }
  return api.post("/api/order", { action: "create_inter_district", ...payload });
}
