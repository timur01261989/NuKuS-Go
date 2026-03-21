import { bodyTypeVisuals } from "@/assets/auto-market/pro/index.js";
import { buildExtendedBodyTypeOptions } from "./autoMarketExtendedSignals";

export const curatedBodyTypeOptions = [
  { key: "sedan", label: "Sedan", filterValue: "Sedan", asset: bodyTypeVisuals["sedan"] },
  { key: "compact", label: "Hatchback", filterValue: "Hatchback", asset: bodyTypeVisuals["compact"] },
  { key: "suv-compact", label: "SUV", filterValue: "SUV", asset: bodyTypeVisuals["suv-compact"] },
  { key: "coupe", label: "Coupe", filterValue: "Coupe", asset: bodyTypeVisuals["coupe"] },
  { key: "minivan-small", label: "Minivan", filterValue: "Minivan", asset: bodyTypeVisuals["minivan-small"] },
  { key: "wagon", label: "Universal", filterValue: "Universal", asset: bodyTypeVisuals["wagon"] },
  { key: "electric", label: "Elektro", filterValue: "Elektro", asset: bodyTypeVisuals["electric"] },
  { key: "hybrid", label: "Gibrid", filterValue: "Gibrid", asset: bodyTypeVisuals["hybrid"] },
  ...buildExtendedBodyTypeOptions(),
];

export const sellerJourneyPrompts = [
  "Hujjat, servis tarixi va narx asosini bir joyda ko‘rsating",
  "Telefon, chat va uchrashuvni alohida ko‘rsatish ishonchni oshiradi",
  "Suratlar to‘liq bo‘lsa sotuv tezlashadi",
];

export const buyerJourneyPrompts = [
  "Narx bozordan balandmi yoki pastmi — bir qarashda ko‘rinsin",
  "Tekshiruv, VIN, kredit va uchrashuv bloklari bir sahifada bo‘lsin",
  "Filterlar brend bilan cheklanmay, kuzov va yoqilg‘i bo‘yicha ham ishlasin",
];