import React, { createContext, useContext, useMemo, useState } from "react";

/**
 * DistrictContext.jsx
 * -------------------------------------------------------
 * "Miya" - interDistrict flow state'larini bitta joyda saqlaydi:
 * - fromDistrict / toDistrict
 * - departureTime (hozir, 1 soatdan keyin, ...)
 * - seats (tanlangan o‘rindiqlar soni yoki sxema)
 * - estimated price, distance, duration
 * - filters (konditsioner, yukxona, ...)
 */

const DistrictContext = createContext(null);

export function DistrictProvider({ children }) {
  // Selection
  const [fromDistrict, setFromDistrict] = useState("Nukus");
  const [toDistrict, setToDistrict] = useState(null);
  const [departureTime, setDepartureTime] = useState("now"); // now | 1h | 2h | custom

  // Seats
  const [seatState, setSeatState] = useState({
    // schema: 1 front seat + 3 back seats (example)
    selected: new Set(), // holds seat ids
  });

  // Route/price
  const [routeInfo, setRouteInfo] = useState({
    distanceKm: null,
    durationMin: null,
    price: null,
  });

  // Driver filters
  const [filters, setFilters] = useState({
    ac: false,
    trunk: false,
  });

  const value = useMemo(
    () => ({
      fromDistrict,
      setFromDistrict,
      toDistrict,
      setToDistrict,
      departureTime,
      setDepartureTime,
      seatState,
      setSeatState,
      routeInfo,
      setRouteInfo,
      filters,
      setFilters,
    }),
    [fromDistrict, toDistrict, departureTime, seatState, routeInfo, filters]
  );

  return <DistrictContext.Provider value={value}>{children}</DistrictContext.Provider>;
}

export function useDistrict() {
  const ctx = useContext(DistrictContext);
  if (!ctx) throw new Error("useDistrict() must be used inside <DistrictProvider/>");
  return ctx;
}
