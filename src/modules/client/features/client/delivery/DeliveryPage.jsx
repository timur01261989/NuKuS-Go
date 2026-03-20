import React from "react";
import { Button, Space } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { ContactPickerModal, LocationPickerDrawer, pageBg } from "./DeliveryPage.helpers";
import DeliveryRequestForm from "./components/DeliveryRequestForm.jsx";
import DeliveryOrdersSection from "./components/DeliveryOrdersSection.jsx";
import { useDeliveryPageController } from "./hooks/useDeliveryPageController.js";
import { useNavigate } from "react-router-dom";

export default function DeliveryPage() {
  const controller = useDeliveryPageController();
  const navigate = useNavigate();
  const {
    cp,
    price,
    contacts,
    contactsLoading,
    contactsOpen,
    setContactsOpen,
    handlePickContact,
    mapTarget,
    setMapTarget,
    currentCenter,
    pickup,
    dropoff,
    handleMapSave,
  } = controller;

  return (
    <div className="unigo-page" style={{ maxWidth: 920, margin: "0 auto", padding: 16, paddingBottom: 100, minHeight: "100vh", background: pageBg }}>
      <Space align="center" style={{ width: "100%", justifyContent: "space-between" }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>{cp("Orqaga")}</Button>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, opacity: 0.75 }}>{cp("Hisoblangan narx")}</div>
          <div style={{ fontWeight: 900, fontSize: 22 }}>{price.toLocaleString("uz-UZ")} {cp("so'm")}</div>
        </div>
      </Space>

      <DeliveryRequestForm {...controller} />
      <DeliveryOrdersSection cp={cp} orders={controller.orders} handleEdit={controller.handleEdit} handleDelete={controller.handleDelete} telemetryMeta={controller.telemetryMeta} />

      <LocationPickerDrawer
        open={Boolean(mapTarget)}
        title={mapTarget === "pickup" ? cp("Olish manzilini tanlang") : cp("Topshirish manzilini tanlang")}
        center={currentCenter}
        value={mapTarget === "pickup" ? pickup.point : dropoff.point}
        onClose={() => setMapTarget(null)}
        onConfirm={handleMapSave}
      />

      <ContactPickerModal
        open={contactsOpen}
        onClose={() => setContactsOpen(false)}
        contacts={contacts}
        onPick={handlePickContact}
        loading={contactsLoading}
      />
    </div>
  );
}