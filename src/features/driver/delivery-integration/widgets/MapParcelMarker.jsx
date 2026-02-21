import React from "react";

/**
 * Shared modul bo'lgani uchun bu fayl react-leaflet import qilmaydi.
 * Siz o'zingizning map componentingizda parcelPinSvg() ni marker icon sifatida ishlatasiz.
 */
export const parcelPinSvg = (tone = "gold") => {
  const fill = tone === "blue" ? "#1677ff" : tone === "green" ? "#52c41a" : "#faad14";
  return `
  <svg width="38" height="46" viewBox="0 0 38 46" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 45c8-9 15-16 15-26C34 8.4 27.3 2 19 2S4 8.4 4 19c0 10 7 17 15 26z" fill="${fill}" opacity="0.95"/>
    <circle cx="19" cy="19" r="10" fill="white" opacity="0.95"/>
    <path d="M13 15h12v8H13z" fill="${fill}"/>
    <path d="M13 15l6-4 6 4" fill="${fill}" opacity="0.8"/>
    <path d="M19 11v12" stroke="white" stroke-width="2" opacity="0.9"/>
  </svg>`;
};

export default function MapParcelMarker() {
  return null;
}
