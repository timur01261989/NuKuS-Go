import React from "react";
import { TRUCKS } from "../../services/truckData";
import { useFreight } from "../../context/FreightContext";
import TruckCard from "./TruckCard";

export default function TruckSelector() {
  const { truckId, setTruckId } = useFreight();
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {TRUCKS.map((t) => (
        <TruckCard key={t.id} truck={t} selected={t.id === truckId} onClick={() => setTruckId(t.id)} />
      ))}
    </div>
  );
}
