import React from "react";
import { Checkbox, Space, Typography, Card } from "antd";
import { useDistrict } from "../../context/DistrictContext";
import { useClientText } from "../../../shared/i18n_clientLocalize";

/**
 * FilterBar.jsx
 * -------------------------------------------------------
 * Qidiruv filtrlari (Konditsioner, yukxona va h.k.)
 * * "YAGONA REYS" QO'SHIMCHALARI: 
 * - Ayollar uchun maxsus reys filtri (femaleOnly)
 * - Faqat pochta oluvchi mashinalarni izlash filtri (delivery)
 */
export default function FilterBar() {
  const { filters, setFilters } = useDistrict();
  const { cp } = useClientText();

  const handleChange = (key, val) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <Card style={{ borderRadius: 18 }} styles={{ body: { padding: "12px 16px" } }}>
      <Typography.Text style={{ fontWeight: 700, display: "block", marginBottom: 10 }}>
        {cp("Qo‘shimcha qulayliklar")}
      </Typography.Text>
      
      <Space direction="vertical" style={{ width: "100%" }}>
        {/* Eski filtrlar (o'zgarishsiz qoldi) */}
        <Checkbox
          checked={filters.ac}
          onChange={(e) => handleChange("ac", e.target.checked)}
        >
          ❄️ {cp("Konditsioner")}
        </Checkbox>
        <Checkbox
          checked={filters.trunk}
          onChange={(e) => handleChange("trunk", e.target.checked)}
        >
          🧳 {cp("Katta yukxona (Bagaj)")}
        </Checkbox>

        {/* YANGI: Yagona Reys filtrlari */}
        <Checkbox
          checked={filters.femaleOnly}
          onChange={(e) => handleChange("femaleOnly", e.target.checked)}
          style={{ color: "#eb2f96", fontWeight: 500 }}
        >
          👩 {cp("Faqat ayollar uchun (Xavfsiz reys)")}
        </Checkbox>
        
        <Checkbox
          checked={filters.delivery}
          onChange={(e) => handleChange("delivery", e.target.checked)}
          style={{ color: "#52c41a", fontWeight: 500 }}
        >
          📦 {cp("Pochta olib ketishga rozi")}
        </Checkbox>
      </Space>
    </Card>
  );
}