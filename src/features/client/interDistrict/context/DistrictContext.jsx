import React, { createContext, useContext, useMemo, useState } from "react";

/**
 * DistrictContext.jsx (Client)
 * -------------------------------------------------------
 * Client tarafdagi "Tumanlar aro" state.
 * Talab:
 * - Hudud (viloyat) tanlash
 * - Hududga bog‘liq tumanlar (qaerdan/qaerga)
 * - "Manzildan manzilgacha" rejimi (door-to-door): pickup/dropoff address + map picker
 * - Ketish vaqti: sana + soat
 * - O‘rindiq tanlash + "butun salon" (door-to-door’da)
 * - Filter: konditsioner, yukxona
 * - Map route: polyline + distance/duration
 */

// Vercel build xatosi va 'null' destructure qulashini oldini olish uchun global xotira va bo'sh obyekt ishlatildi
const DistrictContext = globalThis.__DISTRICT_CONTEXT__ || (globalThis.__DISTRICT_CONTEXT__ = createContext({}));

export function DistrictProvider({ children }) {
  // Region + districts
  const [regionId, setRegionId] = useState("karakalpakstan");
  const [fromDistrict, setFromDistrict] = useState(null);
  const [toDistrict, setToDistrict] = useState(null);

  // Mode: pitak vs door-to-door
  const [doorToDoor, setDoorToDoor] = useState(false);

  // Door-to-door points/addresses (optional)
  const [pickupPoint, setPickupPoint] = useState(null); // {lat,lng}
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffPoint, setDropoffPoint] = useState(null); // {lat,lng}
  const [dropoffAddress, setDropoffAddress] = useState("");

  // Departure datetime
  const [departDate, setDepartDate] = useState(null); // YYYY-MM-DD
  const [departTime, setDepartTime] = useState(null); // HH:mm

  // Seats
  const [seatState, setSeatState] = useState({
    selected: new Set(),
    wantsFullSalon: false,
  });

  // Route
  const [routeInfo, setRouteInfo] = useState({
    distanceKm: null,
    durationMin: null,
    polyline: null, // [[lat,lng],...]
  });

  // Filters
  const [filters, setFilters] = useState({ ac: false, trunk: false });

  const value = useMemo(
    () => ({
      regionId,
      setRegionId,
      fromDistrict,
      setFromDistrict,
      toDistrict,
      setToDistrict,

      doorToDoor,
      setDoorToDoor,

      pickupPoint,
      setPickupPoint,
      pickupAddress,
      setPickupAddress,

      dropoffPoint,
      setDropoffPoint,
      dropoffAddress,
      setDropoffAddress,

      departDate,
      setDepartDate,
      departTime,
      setDepartTime,

      seatState,
      setSeatState,

      routeInfo,
      setRouteInfo,

      filters,
      setFilters,
    }),
    [
      regionId,
      fromDistrict,
      toDistrict,
      doorToDoor,
      pickupPoint,
      pickupAddress,
      dropoffPoint,
      dropoffAddress,
      departDate,
      departTime,
      seatState,
      routeInfo,
      filters,
    ]
  );

  return <DistrictContext.Provider value={value}>{children}</DistrictContext.Provider>;
}

export function useDistrict() {
  const ctx = useContext(DistrictContext);
  if (!ctx || Object.keys(ctx).length === 0) {
    console.warn("useDistrict() must be used inside <DistrictProvider/>");
    return {}; // Destructure xatosini (null) chetlab o'tish uchun bo'sh obyekt qaytaradi
  }
  return ctx;
}