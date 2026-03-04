import React from "react";
import { Card, Typography, Space, message, Switch } from "antd";
import { useDistrict } from "../../context/DistrictContext";

export default function CarSeatSchema() {
  const { seatState, setSeatState, doorToDoor } = useDistrict();

  // O'rindiqni qo'lda tanlash yoki bekor qilish
  const toggleSeat = (seatId) => {
    // Agar "Butun salon" tanlangan bo'lsa, alohida o'rindiqni o'zgartirishga ruxsat bermaslik
    if (seatState.wantsFullSalon) {
      message.warning("Butun salon band qilingan. Alohida tanlash uchun avval 'Butun salonni band qilish' ni bekor qiling.");
      return;
    }

    const newSelected = new Set(seatState.selected);
    if (newSelected.has(seatId)) {
      newSelected.delete(seatId);
    } else {
      newSelected.add(seatId);
    }

    setSeatState({ ...seatState, selected: newSelected });
  };

  // Butun salonni band qilishni yoqish / o'chirish
  const handleFullSalonToggle = (checked) => {
    if (checked) {
      setSeatState({
        selected: new Set([1, 2, 3, 4]), // Barcha o'rindiqlarni tanlash
        wantsFullSalon: true,
      });
      message.success("Butun salon tanlandi");
    } else {
      setSeatState({
        selected: new Set(), // Tanlovni tozalash
        wantsFullSalon: false,
      });
    }
  };

  // O'rindiqlarning vizual dizayni (tanlangan yoki yo'qligiga qarab)
  const getSeatStyle = (seatId) => {
    const isSelected = seatState.selected?.has(seatId);
    return {
      width: 65,
      height: 65,
      borderRadius: 12,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: seatState.wantsFullSalon && !isSelected ? "not-allowed" : "pointer",
      backgroundColor: isSelected ? "#1677ff" : "#ffffff",
      color: isSelected ? "#ffffff" : "#333333",
      fontWeight: isSelected ? "bold" : "normal",
      border: isSelected ? "none" : "2px solid #e8e8e8",
      boxShadow: isSelected ? "0 4px 10px rgba(22, 119, 255, 0.3)" : "none",
      transition: "all 0.3s ease",
      userSelect: "none"
    };
  };

  return (
    <Card
      bodyStyle={{ padding: "16px 12px" }}
      style={{
        borderRadius: 16,
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        border: "none",
      }}
    >
      <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 16 }}>
        O'rindiqni tanlang
      </Typography.Title>

      {/* Faqat Manzildan-manzilgacha (doorToDoor) rejimidagina ko'rinadi */}
      {doorToDoor && (
        <div 
          style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between", 
            marginBottom: 16, 
            padding: "12px 16px", 
            backgroundColor: "#e6f4ff", 
            borderRadius: 12,
            border: "1px solid #91caff"
          }}
        >
          <Typography.Text strong style={{ color: "#1677ff", fontSize: 14 }}>
            Butun salonni band qilish
          </Typography.Text>
          <Switch 
            checked={seatState.wantsFullSalon} 
            onChange={handleFullSalonToggle} 
          />
        </div>
      )}

      {/* Mashina saloni sxemasi */}
      <div 
        style={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          gap: 20, 
          padding: 24, 
          backgroundColor: "#f5f5f5", 
          borderRadius: 16,
          border: "2px dashed #d9d9d9"
        }}
      >
        {/* Oldingi qator: Haydovchi va bitta yo'lovchi */}
        <Space size={32}>
          <div 
            style={{ 
              ...getSeatStyle("driver"), 
              backgroundColor: "#d9d9d9", 
              cursor: "not-allowed", 
              color: "#888", 
              border: "none",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1)"
            }}
          >
            Rul
          </div>
          <div style={getSeatStyle(1)} onClick={() => toggleSeat(1)}>
            Old
          </div>
        </Space>

        {/* Orqa qator: Uchta yo'lovchi */}
        <Space size={16}>
          <div style={getSeatStyle(2)} onClick={() => toggleSeat(2)}>
            Chap
          </div>
          <div style={getSeatStyle(3)} onClick={() => toggleSeat(3)}>
            O'rta
          </div>
          <div style={getSeatStyle(4)} onClick={() => toggleSeat(4)}>
            O'ng
          </div>
        </Space>
      </div>
    </Card>
  );
}