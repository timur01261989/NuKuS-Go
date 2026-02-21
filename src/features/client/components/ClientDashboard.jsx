import React, { useState } from "react";
import { Card, Typography, Row, Col, Button } from "antd";
import { 
  CarOutlined, 
  RocketOutlined, 
  EnvironmentOutlined, 
  TruckOutlined, 
  ShopOutlined 
} from "@ant-design/icons";

// -------------------------------------------------------
// 1. YANGI MODULLARNI IMPORT QILISH
// (Fayl yo'llarini o'zingizdagi papkaga qarab to'g'rilang)
// -------------------------------------------------------
import ClientTaxiPage from "../taxi/ClientTaxiPage";
import DeliveryPage from "../delivery/DeliveryPage";
import ClientInterProvincial from "../intercity/ClientIntercityPage";
// import FreightPage from "./freight/FreightPage"; // Agar tayyor bo'lsa oching
import MarketEntry from "../../auto-market/AutoMarketEntry"; // Yoki MarketRouter

const { Text } = Typography;

export default function ClientDashboard() {
  // Bu state qaysi xizmat ochilganini bilib turadi
  // null = Asosiy menyu (tugmalar)
  // 'taxi' = Taksi xizmati
  // 'delivery' = Eltib berish
  const [selectedService, setSelectedService] = useState(null);

  // Orqaga (Menyuga) qaytish funksiyasi
  const goBack = () => setSelectedService(null);

  // -------------------------------------------------------
  // 2. TUGMALAR RO'YXATI
  // -------------------------------------------------------
  const services = [
    { 
      key: "taxi", 
      title: "Taksi", 
      icon: <CarOutlined style={{ fontSize: 40 }} />, 
      color: "#faad14", // Sariq
      bg: "#fffbe6" 
    },
    { 
      key: "delivery", 
      title: "Eltib berish", 
      icon: <RocketOutlined style={{ fontSize: 40 }} />, 
      color: "#52c41a", // Yashil
      bg: "#f6ffed" 
    },
    { 
      key: "intercity", 
      title: "Viloyatlar aro", 
      icon: <EnvironmentOutlined style={{ fontSize: 40 }} />, 
      color: "#1890ff", // Ko'k
      bg: "#e6f7ff" 
    },
    { 
      key: "market", 
      title: "Avto Bozor", 
      icon: <ShopOutlined style={{ fontSize: 40 }} />, 
      color: "#722ed1", // Binafsha
      bg: "#f9f0ff" 
    },
    { 
      key: "freight", 
      title: "Yuk tashish", 
      icon: <TruckOutlined style={{ fontSize: 40 }} />, 
      color: "#fa541c", // Qizil
      bg: "#fff2e8" 
    },
  ];

  // -------------------------------------------------------
  // 3. TANLOVGA QARAB OYNANI O'ZGARTIRISH
  // -------------------------------------------------------
  if (selectedService === "taxi") {
    return <ClientTaxiPage onBack={goBack} />;
  }
  if (selectedService === "delivery") {
    return <DeliveryPage onBack={goBack} />;
  }
  if (selectedService === "intercity") {
    return <ClientInterProvincial onBack={goBack} />;
  }
  if (selectedService === "market") {
    return <MarketEntry onBack={goBack} />;
  }
  if (selectedService === "freight") {
    // Freight tayyor bo'lmasa:
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        <h2>Tez kunda...</h2>
        <Button onClick={goBack}>Orqaga</Button>
      </div>
    );
  }

  // -------------------------------------------------------
  // 4. ASOSIY EKRAN (Tugmalar)
  // -------------------------------------------------------
  return (
    <div style={{ padding: 16, paddingBottom: 80 }}>
      {/* Tepadagi Header qismi Dashboard.jsx da bor, bu yerga shart emas */}
      
      <Row gutter={[16, 16]}>
        {services.map((item) => (
          <Col span={12} key={item.key}>
            <Card
              hoverable
              onClick={() => setSelectedService(item.key)}
              style={{
                borderRadius: 24,
                border: "none",
                textAlign: "center",
                height: 160,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                background: item.bg,
                boxShadow: "0 4px 15px rgba(0,0,0,0.05)"
              }}
            >
              <div 
                style={{ 
                  color: item.color, 
                  marginBottom: 12,
                  background: "#fff",
                  borderRadius: "50%",
                  width: 70,
                  height: 70,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
                }}
              >
                {item.icon}
              </div>
              <Text strong style={{ fontSize: 16 }}>{item.title}</Text>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Agar Avto Bozor "preview" qismi kerak bo'lsa, shu yerga qo'shasiz */}
      {/* <AutoMarketPreview /> */}
    </div>
  );
}