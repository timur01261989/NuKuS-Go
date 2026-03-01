import React from "react";
import { Input, InputNumber, Typography } from "antd";
import { useFreight } from "../../context/FreightContext";
const { Text } = Typography;

export default function CargoForm() {
  const { cargoName, setCargoName, cargoType, setCargoType, weightKg, setWeightKg, volumeM3, setVolumeM3, note, setNote } = useFreight();
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>Yuk nima?</div>
        <Input value={cargoName} onChange={(e) => setCargoName(e.target.value)} placeholder='Masalan: "Mebel", "Qurilish moli"' />
        <Text type="secondary" style={{ fontSize: 12 }}>Qisqa yozing.</Text>
      </div>

      <div>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>Yuk turi (ixtiyoriy)</div>
        <Input value={cargoType} onChange={(e) => setCargoType(e.target.value)} placeholder='Masalan: "Mo‘rt", "Sovutiladigan"' />
        <Text type="secondary" style={{ fontSize: 12 }}>Logistika uchun foydali.</Text>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Og‘irlik (kg)</div>
          <InputNumber style={{ width: "100%" }} min={0} value={weightKg} onChange={(v) => setWeightKg(Number(v || 0))} />
        </div>
        <div>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Hajm (m³)</div>
          <InputNumber style={{ width: "100%" }} min={0} step={0.1} value={volumeM3} onChange={(v) => setVolumeM3(Number(v || 0))} />
        </div>
      </div>

      <div>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>Izoh (ixtiyoriy)</div>
        <Input.TextArea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Masalan: 3-qavat, lift yo‘q..." />
      </div>
    </div>
  );
}
