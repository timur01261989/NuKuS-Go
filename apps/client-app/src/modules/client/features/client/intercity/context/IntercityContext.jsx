import React, { createContext, useContext, useMemo, useState } from "react";
import dayjs from "dayjs";

/**
 * IntercityContext.jsx
 * - Intercity flow uchun barcha state'lar shu yerda: A/B shahar, sana, yo'lovchi soni, o'rindiqlar, tanlangan offer.
 */

const IntercityContext = createContext(null);

const DEFAULT_FROM = {
  id: "toshkent",
  title: "Toshkent",
  latlng: [41.2995, 69.2401],
};

const DEFAULT_TO = {
  id: "nukus",
  title: "Nukus",
  latlng: [42.4600, 59.6103],
};

export function IntercityProvider({ children }) {
  const [fromCity, setFromCity] = useState(DEFAULT_FROM);
  const [toCity, setToCity] = useState(DEFAULT_TO);

  const [travelDate, setTravelDate] = useState(dayjs().add(1, "day"));
  const [passengers, setPassengers] = useState(1);

  // seatIds: ["A1","A2","B1","B2"] kabi (SeatSelector ichida sxema bor)
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);

  const value = useMemo(
    () => ({
      fromCity,
      setFromCity,
      toCity,
      setToCity,
      travelDate,
      setTravelDate,
      passengers,
      setPassengers,
      selectedSeats,
      setSelectedSeats,
      selectedOffer,
      setSelectedOffer,
    }),
    [fromCity, toCity, travelDate, passengers, selectedSeats, selectedOffer]
  );

  return <IntercityContext.Provider value={value}>{children}</IntercityContext.Provider>;
}

export function useIntercity() {
  const ctx = useContext(IntercityContext);
  if (!ctx) throw new Error("useIntercity must be used inside <IntercityProvider />");
  return ctx;
}

export const PRESET_CITIES = [
  { id: "toshkent", title: "Toshkent", latlng: [41.2995, 69.2401] },
  { id: "samarqand", title: "Samarqand", latlng: [39.6542, 66.9597] },
  { id: "buxoro", title: "Buxoro", latlng: [39.7681, 64.4556] },
  { id: "andijon", title: "Andijon", latlng: [40.7834, 72.3507] },
  { id: "namangan", title: "Namangan", latlng: [40.9983, 71.6726] },
  { id: "fargona", title: "Farg'ona", latlng: [40.3864, 71.7864] },
  { id: "qarshi", title: "Qarshi", latlng: [38.8610, 65.7847] },
  { id: "termiz", title: "Termiz", latlng: [37.2242, 67.2783] },
  { id: "urganch", title: "Urganch", latlng: [41.5507, 60.6310] },
  { id: "nukus", title: "Nukus", latlng: [42.4600, 59.6103] },
  { id: "jizzax", title: "Jizzax", latlng: [40.1158, 67.8422] },
  { id: "navoiy", title: "Navoiy", latlng: [40.1039, 65.3688] },
  { id: "guliston", title: "Guliston", latlng: [40.4897, 68.7849] },
  { id: "qoqon", title: "Qo'qon", latlng: [40.5286, 70.9428] },
];


// Expose context for optional consumers (e.g. small map preview)
export { IntercityContext };
