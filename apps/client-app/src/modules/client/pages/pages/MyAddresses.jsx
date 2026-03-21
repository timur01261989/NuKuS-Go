import React from "react";
import { Divider, Typography } from "antd";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

import { usePageI18n } from "./pageI18n";
import { BRAND, MapPickerModal } from "./myAddresses.helpers.jsx";
import { useMyAddressesController } from "./myAddresses.logic.js";
import {
  AddressFormCard,
  AddressesGrid,
  MyAddressesFooter,
  MyAddressesHeader,
} from "./myAddresses.sections.jsx";

const { Text } = Typography;

const defaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

const MyAddresses = () => {
  const { t } = usePageI18n();
  const {
    form,
    items,
    isMapOpen,
    setIsMapOpen,
    onFinish,
    removeAddress,
    handleMapSelection,
  } = useMyAddressesController();

  return (
    <div
      style={{
        padding: "30px 20px",
        maxWidth: 1000,
        margin: "0 auto",
        backgroundColor: BRAND.grey,
        minHeight: "100vh",
      }}
    >
      <MyAddressesHeader t={t} />

      <AddressFormCard form={form} onFinish={onFinish} onOpenMap={() => setIsMapOpen(true)} />

      <Divider orientation="left" style={{ borderColor: "#d1d1d1" }}>
        <Text strong style={{ color: "#8c8c8c", fontSize: 12 }}>SAQLANGANLAR</Text>
      </Divider>

      <AddressesGrid items={items} onRemove={removeAddress} />

      <MapPickerModal
        visible={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onSelect={handleMapSelection}
      />

      <MyAddressesFooter />
    </div>
  );
};

export default MyAddresses;
