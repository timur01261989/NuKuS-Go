import React, { useEffect } from "react";
import { Card, DatePicker, TimePicker, Typography, Space, Button } from "antd"; // Button qo'shildi
import { ClockCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useDistrict } from "../../context/DistrictContext";
import { useClientText } from "../../../shared/i18n_clientLocalize";

/**
 * DepartureTime.jsx (Client)
 * -------------------------------------------------------
 * Ketish vaqti: Calendar (sana) + Soat (time)
 * * "YAGONA REYS" QO'SHIMCHALARI:
 * - Tezkor tanlash tugmalari ("Hozir / Bugun", "Ertaga (Rejali)") qo'shildi.
 * - Tanlangan sanaga qarab avtomatik tarzda "Hamyo'l" yoki "Tezkor" rejimiga o'tish mantig'i kiritildi.
 */
export default function DepartureTime() {
  // YANGI: Contextdan setIsHamyo ni ham chaqirib oldik
  const { departDate, setDepartDate, departTime, setDepartTime, setIsHamyo } = useDistrict();
  const { cp } = useClientText();

  // default: bugun + 1 soat (Eski kod o'zgarishsiz qoldi)
  useEffect(() => {
    if (!departDate) setDepartDate(dayjs().format("YYYY-MM-DD"));
    if (!departTime) setDepartTime(dayjs().add(1, "hour").format("HH:mm"));
  }, [departDate, departTime, setDepartDate, setDepartTime]);

  // YANGI: Sanaga qarab "Hamyo'l" (Rejalashtirilgan) rejimini avtomatik aniqlash
  useEffect(() => {
    if (setIsHamyo && departDate) {
      // Agar tanlangan sana bugundan keyin (ertaga yoki undan keyin) bo'lsa, Hamyo'l yonadi
      const isFutureDate = dayjs(departDate).isAfter(dayjs(), 'day');
      setIsHamyo(isFutureDate); 
    }
  }, [departDate, setIsHamyo]);

  // YANGI: UX uchun tezkor vaqt tanlash tugmalari funksiyasi
  const setQuickTime = (type) => {
    if (type === 'now') {
      setDepartDate(dayjs().format("YYYY-MM-DD"));
      setDepartTime(dayjs().add(15, "minute").format("HH:mm")); // 15 daqiqadan keyin deb belgilaydi
    } else if (type === 'tomorrow') {
      setDepartDate(dayjs().add(1, "day").format("YYYY-MM-DD"));
      setDepartTime("09:00"); // Ertaga ertalab soat 9 ga tayyorlaydi
    }
  };

  return (
    <Card style={{ borderRadius: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ClockCircleOutlined style={{ color: "#1677ff" }} />
          <Typography.Text style={{ fontWeight: 700 }}>{cp("Ketish vaqti")}</Typography.Text>
        </div>
        
        {/* YANGI: Holatni ko'rsatib turuvchi jonli matn */}
        {departDate && dayjs(departDate).isAfter(dayjs(), 'day') ? (
          <Typography.Text style={{ fontSize: 12, color: "#fa8c16", fontWeight: 600 }}>📅 {cp("Hamyo'l rejimi")}</Typography.Text>
        ) : (
          <Typography.Text style={{ fontSize: 12, color: "#52c41a", fontWeight: 600 }}>⚡ {cp("Tezkor qidiruv")}</Typography.Text>
        )}
      </div>

      {/* YANGI: Foydalanuvchi qiynalmasligi uchun tezkor tugmalar */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <Button 
          size="small" 
          type={(!departDate || departDate === dayjs().format("YYYY-MM-DD")) ? "primary" : "default"} 
          onClick={() => setQuickTime('now')}
          style={{ borderRadius: 12, fontWeight: 500 }}
        >
          Hozir / Bugun
        </Button>
        <Button 
          size="small" 
          type={(departDate === dayjs().add(1, "day").format("YYYY-MM-DD")) ? "primary" : "default"} 
          onClick={() => setQuickTime('tomorrow')}
          style={{ borderRadius: 12, fontWeight: 500 }}
        >
          Ertaga (Rejali)
        </Button>
      </div>

      {/* Eski sana va soat tanlash kalendari */}
      <Space style={{ width: "100%" }} size={10}>
        <div style={{ flex: 1 }}>
          <Typography.Text style={{ fontSize: 12, opacity: 0.7 }}>{cp("Sana")}</Typography.Text>
          <DatePicker
            value={departDate ? dayjs(departDate, "YYYY-MM-DD") : null}
            onChange={(v) => setDepartDate(v ? v.format("YYYY-MM-DD") : null)}
            style={{ width: "100%", marginTop: 6 }}
            size="large"
            allowClear={false} // UX: Sanani o'chirib yuborishni bloklaydi
          />
        </div>
        <div style={{ flex: 1 }}>
          <Typography.Text style={{ fontSize: 12, opacity: 0.7 }}>{cp("Soat")}</Typography.Text>
          <TimePicker
            value={departTime ? dayjs(departTime, "HH:mm") : null}
            onChange={(v) => setDepartTime(v ? v.format("HH:mm") : null)}
            format="HH:mm"
            style={{ width: "100%", marginTop: 6 }}
            size="large"
            allowClear={false} // UX: Soatni o'chirib yuborishni bloklaydi
          />
        </div>
      </Space>
    </Card>
  );
}