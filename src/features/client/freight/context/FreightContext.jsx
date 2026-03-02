import React, { createContext, useContext, useMemo, useState } from "react";
import { LOADERS_FEE_EACH, TRUCKS } from "../services/truckData";

const FreightContext = createContext(null);

export function FreightProvider({ children }) {
  const [truckId, setTruckId] = useState(TRUCKS[0]?.id || "motoruller");

  const [pickup, setPickup] = useState({ latlng: null, address: "" });
  const [dropoff, setDropoff] = useState({ latlng: null, address: "" });

  // Map selection mode: 'pickup' | 'dropoff' | null
  const [selecting, setSelecting] = useState(null);

  const [cargoName, setCargoName] = useState("");
  const [cargoType, setCargoType] = useState("");
  const [weightKg, setWeightKg] = useState(0);
  const [volumeM3, setVolumeM3] = useState(0);
  const [note, setNote] = useState("");

  const [photoFile, setPhotoFile] = useState(null);
  const [photoUrl, setPhotoUrl] = useState("");

  const [loadersEnabled, setLoadersEnabled] = useState(false);
  const [loadersCount, setLoadersCount] = useState(0);

  const [distanceKm, setDistanceKm] = useState(null);
  const [durationMin, setDurationMin] = useState(null);

  const truck = useMemo(() => TRUCKS.find((t) => t.id === truckId) || TRUCKS[0], [truckId]);
  const loadersFee = useMemo(() => (loadersEnabled ? (Number(loadersCount) || 0) * LOADERS_FEE_EACH : 0), [loadersEnabled, loadersCount]);

  const estimatedPrice = useMemo(() => {
    const base = Number(truck?.basePrice) || 0;
    const perKm = Number(truck?.perKm) || 0;
    const km = Number(distanceKm) || 0;
    const routePart = km > 0 ? km * perKm : 0;
    return base + routePart + loadersFee;
  }, [truck, distanceKm, loadersFee]);

  const value = useMemo(
    () => ({
      truckId, setTruckId, truck,
      pickup, setPickup,
      dropoff, setDropoff,
      selecting, setSelecting,
      cargoName, setCargoName,
      cargoType, setCargoType,
      weightKg, setWeightKg,
      volumeM3, setVolumeM3,
      note, setNote,
      photoFile, setPhotoFile,
      photoUrl, setPhotoUrl,
      loadersEnabled, setLoadersEnabled,
      loadersCount, setLoadersCount,
      distanceKm, setDistanceKm,
      durationMin, setDurationMin,
      loadersFee,
      estimatedPrice,
    }),
    [truckId, truck, pickup, dropoff, selecting, cargoName, cargoType, weightKg, volumeM3, note, photoFile, photoUrl, loadersEnabled, loadersCount, distanceKm, durationMin, loadersFee, estimatedPrice]
  );

  return <FreightContext.Provider value={value}>{children}</FreightContext.Provider>;
}

export function useFreight() {
  const ctx = useContext(FreightContext);
  if (!ctx) throw new Error("useFreight must be used within FreightProvider");
  return ctx;
}
