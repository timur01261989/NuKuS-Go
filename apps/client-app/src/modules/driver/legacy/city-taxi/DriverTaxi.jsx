import React from "react";
import { Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import CityTaxiPage from "./CityTaxiPage";

/**
 * DriverTaxi
 *
 * DriverHome ichida "cityTaxi" servisi tanlanganda shu komponent ochiladi.
 * Oldin DriverHome onBack prop yuborardi, lekin bu yerda ishlatilmagan.
 * Natijada "Shahar ichi" sahifasidan ortga qaytishning aniq yo'li qolmagan.
 *
 * Ishlash prinsipi o'zgarmaydi: CityTaxiPage o'z holicha ishlaydi.
 * Faqat ustiga kichik "Orqaga" tugmasi qo'shiladi va u onBack() chaqiradi.
 */
const DriverTaxi = ({ onBack }) => {
  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <div
        style={{
          position: "fixed",
          top: 14,
          left: 14,
          zIndex: 9999,
        }}
      >
        <Button
          onClick={() => {
            if (typeof onBack === "function") onBack();
          }}
          icon={<ArrowLeftOutlined />}
          shape="circle"
          size="large"
          style={{
            background: "#ffffff",
            border: "1px solid rgba(0,0,0,0.12)",
            boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
          }}
        />
      </div>

      <CityTaxiPage />
    </div>
  );
};

export default DriverTaxi;
