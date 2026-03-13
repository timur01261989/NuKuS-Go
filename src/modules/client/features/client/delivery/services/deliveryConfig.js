import { UZ_REGIONS } from "@/shared/constants/uzRegions";

export const DELIVERY_SERVICE_MODES = [
  { key: "city", label: "Shahar ichida eltish" },
  { key: "district", label: "Tumanlar aro eltish" },
  { key: "region", label: "Viloyatlar aro eltish" },
];

export const PARCEL_TYPES = [
  { value: "document", label: "Hujjat", maxKg: 0, base: 1 },
  { value: "key", label: "Kalit", maxKg: 0, base: 1.1 },
  { value: "small_item", label: "Kichik buyum", maxKg: 1, base: 1.2 },
  { value: "item", label: "Buyum", maxKg: 5, base: 1.35 },
];

export function getParcelMeta(type) {
  return PARCEL_TYPES.find((item) => item.value === type) || PARCEL_TYPES[0];
}

export function getDistrictsByRegionName(regionName) {
  return UZ_REGIONS.find((item) => item.name === regionName)?.districts || [];
}

export function getRegionCenterByName(regionName) {
  return UZ_REGIONS.find((item) => item.name === regionName)?.center || [41.3111, 69.2797];
}

export function getStandardPointLabel(region, district) {
  const regionName = region || "Hudud";
  const districtName = district || "markazi";
  return `${regionName} / ${districtName} markaziy bekati`;
}

export function calculateDeliveryPrice({
  serviceMode,
  parcelType,
  weightKg,
  pickupMode,
  dropoffMode,
}) {
  const meta = getParcelMeta(parcelType);
  const modeBase = {
    city: 12000,
    district: 25000,
    region: 70000,
  };
  const pickupExtra = pickupMode === "precise" ? (serviceMode === "city" ? 0 : 12000) : 0;
  const dropoffExtra = dropoffMode === "precise" ? (serviceMode === "city" ? 0 : 12000) : 0;
  const weightExtra = meta.maxKg > 0 ? Math.max(0, Number(weightKg || 0) - 1) * 2500 : 0;
  const base = modeBase[serviceMode] || 12000;
  return Math.round((base + pickupExtra + dropoffExtra + weightExtra) * meta.base);
}

export function getDeliveryStatusSteps(status) {
  const list = [
    { key: "searching", label: "Haydovchi qidirilmoqda" },
    { key: "accepted", label: "Haydovchi qabul qildi" },
    { key: "picked_up", label: "Buyum olindi" },
    { key: "delivered", label: "Topshirildi" },
  ];
  const index = list.findIndex((item) => item.key === status);
  return list.map((item, i) => ({ ...item, done: index >= i }));
}
