import React, { createContext, useContext, useMemo, useState } from "react";

/**
 * DistrictContext.jsx (Client) - "Yagona Reys" Tizimi bilan boyitilgan
 * -------------------------------------------------------
 * Client tarafdagi "Tumanlar aro" state boshqaruvi.
 */

const DistrictContext = createContext(null);

export function DistrictProvider({ children }) {
  // 1. Region + districts
  const [regionId, setRegionId] = useState("karakalpakstan");
  const [fromDistrict, setFromDistrict] = useState(null);
  const [toDistrict, setToDistrict] = useState(null);

  // 2. Mode: pitak vs door-to-door vs Hamyo'l
  // (Yagona reys tizimida bular filtrlangan holda birga ishlaydi)
  const [doorToDoor, setDoorToDoor] = useState(false);
  const [isHamyo, setIsHamyo] = useState(false); // Hamyo'l (scheduled) rejimi uchun

  // 3. Door-to-door points/addresses (optional)
  const [pickupPoint, setPickupPoint] = useState(null); // {lat,lng}
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffPoint, setDropoffPoint] = useState(null); // {lat,lng}
  const [dropoffAddress, setDropoffAddress] = useState("");

  // 4. Departure datetime
  const [departDate, setDepartDate] = useState(null); // YYYY-MM-DD
  const [departTime, setDepartTime] = useState(null); // HH:mm

  // 5. Seats (O'rindiqlar va Jins filtri qo'shildi)
  const [seatState, setSeatState] = useState({
    selected: new Set(),
    wantsFullSalon: false,
    passengerGenders: {}, // {seatIndex: 'M' | 'F'} - O'rindiqdagilarning jinsi
  });

  // 6. Route (Polyline + masofa)
  const [routeInfo, setRouteInfo] = useState({
    distanceKm: null,
    durationMin: null,
    polyline: null, // [[lat,lng],...]
  });

  // 7. Filters
  const [filters, setFilters] = useState({ ac: false, trunk: false, petFriendly: false });

  // -------------------------------------------------------
  // YANGI QO'SHILGAN "AQLLI TIZIM" STATE'LARI:
  // -------------------------------------------------------

  // 8. Safar Holati (Trip Status)
  // 'IDLE', 'SEARCHING', 'WAITING_DRIVER', 'PICKING_UP', 'ON_TRIP', 'COMPLETED', 'CANCELLED'
  const [tripStatus, setTripStatus] = useState('IDLE');

  // 9. Haydovchi va GPS Monitoring
  const [activeDriver, setActiveDriver] = useState(null); // {id, name, car, phone, rating}
  const [driverLocation, setDriverLocation] = useState(null); // {lat, lng} - Jonli GPS
  const [eta, setEta] = useState(null); // Haydovchi kelish vaqti (daqiqada)

  // 10. Pochta (Posilka) tizimi
  const [parcelInfo, setParcelInfo] = useState({
    isParcel: false,
    description: "",
    receiverPhone: "",
    weightCategory: "light", // light, medium, heavy
  });

  // 11. Firibgarlikka qarshi (Anti-fraud)
  const [fraudAlert, setFraudAlert] = useState(false); // GPS sinxronligi buzilsa true bo'ladi

  // 12. Hamyon va Komissiya hisobi (Client uchun taxminiy narx)
  const [estimatedPrice, setEstimatedPrice] = useState(0);

  const value = useMemo(
    () => ({
      // Eski ma'lumotlar (to'liq saqlangan)
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

      // Yangi "Yagona Reys" ma'lumotlari
      isHamyo,
      setIsHamyo,
      tripStatus,
      setTripStatus,
      activeDriver,
      setActiveDriver,
      driverLocation,
      setDriverLocation,
      eta,
      setEta,
      parcelInfo,
      setParcelInfo,
      fraudAlert,
      setFraudAlert,
      estimatedPrice,
      setEstimatedPrice
    }),
    [
      regionId, fromDistrict, toDistrict, doorToDoor, pickupPoint, pickupAddress,
      dropoffPoint, dropoffAddress, departDate, departTime, seatState, routeInfo,
      filters, isHamyo, tripStatus, activeDriver, driverLocation, eta, 
      parcelInfo, fraudAlert, estimatedPrice
    ]
  );

  return <DistrictContext.Provider value={value}>{children}</DistrictContext.Provider>;
}

export function useDistrict() {
  const ctx = useContext(DistrictContext);
  if (!ctx) throw new Error("useDistrict() must be used inside <DistrictProvider/>");
  return ctx;
}