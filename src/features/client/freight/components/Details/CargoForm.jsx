import React from "react";
import { Input, Typography } from "antd";
import { useFreight } from "../../context/FreightContext";
const { Text } = Typography;

export default function CargoForm() {
  const { cargoName, setCargoName, note, setNote } = useFreight();
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>Yuk nima?</div>
        <Input value={cargoName} onChange={(e) => setCargoName(e.target.value)} placeholder='Masalan: "Mebel", "Qurilish moli"' />
        <Text type="secondary" style={{ fontSize: 12 }}>Qisqa yozing.</Text>
      </div>
      <div>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>Izoh (ixtiyoriy)</div>
        <Input.TextArea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Masalan: 3-qavat, lift yo‘q..." />
      </div>
    </div>
  );
}
