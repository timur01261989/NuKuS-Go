import React, { useState, memo } from "react";
import { Button, Modal, message } from "antd";
import { SendOutlined, SearchOutlined } from "@ant-design/icons";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { usePageI18n } from "./pageI18n";
import { mapAssets } from "@/assets/map";
import { searchAssets } from "@/assets/search";
import { assetStyles } from "@/assets/assetPolish";

export const BRAND = {
  blue: "#0057b7",
  light: "#ffffff",
  grey: "#f0f2f5",
  darkBlue: "#004494",
};

export const NUKUS_CENTER = [42.4601, 59.6122];
export const STORAGE_KEY = "unigo_addresses_v1";

export const AddressRepository = {
  get: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Storage Error:", e);
      return [];
    }
  },
  save: (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data)),
};

const addressMapMarker = {
  iconUrl: mapAssets.pickupPin || mapAssets.clientPinDay || mapAssets.routePointLive || mapAssets.routePoint,
  iconSize: [38, 46],
  iconAnchor: [19, 41],
};

export function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export const MapPickerModal = memo(function MapPickerModal({ visible, onClose, onSelect }) {
  const [tempPos, setTempPos] = useState(NUKUS_CENTER);
  const { t } = usePageI18n();

  const handleConfirm = () => {
    if (!tempPos) {
      message.warning(t("select_on_map"));
      return;
    }
    onSelect(tempPos[0], tempPos[1]);
    onClose();
  };

  return (
    <Modal
      title={t("choose_from_map")}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>{t("cancel")}</Button>,
        <Button key="confirm" type="primary" icon={<SendOutlined />} onClick={handleConfirm}>{t("select")}</Button>,
      ]}
      width={900}
      styles={{ body: { padding: 0, height: "60vh" } }}
    >
      <MapContainer center={tempPos} zoom={13} style={{ width: "100%", height: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={tempPos} icon={L.icon(addressMapMarker)} />
        <MapClickHandler onSelect={(lat, lng) => setTempPos([lat, lng])} />
      </MapContainer>
      <div style={{ padding: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <img src={searchAssets.poiPin} alt="" style={assetStyles.searchMarkerIcon} />
        <span>{t("click_map_hint")}</span>
      </div>
    </Modal>
  );
});
