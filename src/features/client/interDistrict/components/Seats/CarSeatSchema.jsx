import React, { useMemo } from "react";
import { Card, Typography, Switch, Space, Divider } from "antd";
import { useDistrict } from "../../context/DistrictContext";

/**
 * CarSeatSchema.jsx (Client) - "Yagona Reys" tizimi bilan
 * -------------------------------------------------------
 * O‘rindiq tanlash:
 * - door-to-door rejimida "Butun salon" (full salon) tanlash mumkin.
 * - Agar full salon tanlansa, o‘rindiqlar avtomatik (hammasi) deb hisoblanadi.
 * Qo'shilgan imkoniyatlar:
 * - Band qilingan o'rindiqlar va gender (jins) identifikatsiyasi
 * - Tanlangan o'rindiqlar soniga qarab umumiy narx kalkulyatori
 */
const SEATS = [
  { id: "F1", label: "Old 1" },
  { id: "B1", label: "Orqa 1" },
  { id: "B2", label: "Orqa 2" },
  { id: "B3", label: "Orqa 3" },
];

export default function CarSeatSchema() {
  // 1. Contextdan kerakli state'larni, shu jumladan narxni (estimatedPrice) olamiz
  const { seatState, setSeatState, doorToDoor, estimatedPrice } = useDistrict();

  const selected = seatState.selected;
  const wantsFullSalon = !!seatState.wantsFullSalon;

  // 2. Band qilingan o'rindiqlar va jinslarni aniqlaymiz (Real-time Bandlik va Gender)
  const passengerGenders = seatState.passengerGenders || {};
  const occupiedSeats = Object.keys(passengerGenders);
  const hasOccupiedSeats = occupiedSeats.length > 0;

  const toggleSeat = (id) => {
    if (wantsFullSalon) return;
    
    // Band qilingan o'rindiqni bosishni bloklaymiz
    if (occupiedSeats.includes(id)) return;

    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSeatState({ ...seatState, selected: next });
  };

  // Tanlangan o'rindiqlar sonini hisoblash (band bo'lganlar bundan mustasno)
  const selectedCount = useMemo(() => {
    if (wantsFullSalon) {
      return SEATS.length - occupiedSeats.length;
    }
    return selected.size || 0;
  }, [selected, wantsFullSalon, occupiedSeats.length]);

  // 3. Narx kalkulyatori (Tanlangan o'rindiqlar soni * 1 kishilik narx)
  const totalPrice = useMemo(() => {
    return selectedCount * (estimatedPrice || 0);
  }, [selectedCount, estimatedPrice]);

  return (
    <Card style={{ borderRadius: 18 }}>
      <Space style={{ width: "100%", justifyContent: "space-between" }} align="center">
        <Typography.Text style={{ fontWeight: 700 }}>O‘rindiq tanlash</Typography.Text>
        {doorToDoor && (
          <Space size={8} align="center">
            <Typography.Text style={{ fontSize: 12, opacity: 0.7 }}>Butun salon</Typography.Text>
            <Switch
              checked={wantsFullSalon}
              // Agar mashinada boshqa odam bo'lsa, butun salonni tanlab bo'lmaydi
              disabled={hasOccupiedSeats} 
              onChange={(v) => {
                const nextSelected = v 
                  ? new Set(SEATS.map((s) => s.id).filter(id => !occupiedSeats.includes(id))) 
                  : new Set();
                setSeatState({ ...seatState, wantsFullSalon: v, selected: nextSelected });
              }}
            />
          </Space>
        )}
      </Space>

      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, opacity: wantsFullSalon ? 0.6 : 1 }}>
        {SEATS.map((s) => {
          const isOccupied = occupiedSeats.includes(s.id);
          const gender = passengerGenders[s.id];
          const isOn = selected.has(s.id) || wantsFullSalon;

          // Jinsga qarab ikonka va matn chiqarish
          let seatContent = s.label;
          if (isOccupied) {
             seatContent = gender === 'M' ? `👨 Band` : gender === 'F' ? `👩 Band` : `🔒 Band`;
          }

          return (
            <button
              key={s.id}
              onClick={() => toggleSeat(s.id)}
              disabled={isOccupied}
              style={{
                border: "1px solid rgba(0,0,0,.12)",
                borderRadius: 14,
                padding: "12px 10px",
                fontWeight: 800,
                // Band bo'lsa kulrang, tanlansa yashil, bo'sh bo'lsa oq
                background: isOccupied ? "#f0f0f0" : (isOn ? "rgba(82,196,26,.18)" : "#fff"),
                cursor: (wantsFullSalon || isOccupied) ? "not-allowed" : "pointer",
                color: isOccupied ? "#a0a0a0" : "inherit",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                transition: "all 0.2s ease"
              }}
            >
              <span>{seatContent}</span>
            </button>
          );
        })}
      </div>

      <Divider style={{ margin: "16px 0 8px 0", borderColor: "#f0f0f0" }} />

      {/* Tanlanganlar soni va Real-time Narx Kalkulyatori */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ color: "#666", fontSize: 13 }}>
          Tanlandi: <b>{selectedCount}</b> ta
        </div>
        
        {estimatedPrice > 0 ? (
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fa8c16" }}>
            Umumiy: {totalPrice.toLocaleString()} so'm
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "#999" }}>
            Narx hisoblanmoqda...
          </div>
        )}
      </div>
    </Card>
  );
}