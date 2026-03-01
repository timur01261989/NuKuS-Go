import React, { useMemo, useState, useEffect } from "react";
import { Card, Space, Typography, Select, Modal, Button } from "antd";
import { EnvironmentOutlined, WomanOutlined } from "@ant-design/icons";
import { MapContainer, TileLayer } from "react-leaflet";

// Loyihangizdagi komponentlar va konstantalar (Importlar to'liq)
import RegionDistrictSelect from "../../../../../components/RegionDistrictSelect";
import { getRegionById, formatRegionDistrict } from "../../../../../constants/uzLocations";
import MapCenterPicker from "../../../../map/components/MapCenterPicker";

import { useTrip } from "../../context/TripContext";
import { FEMALE_MODE } from "../../context/tripReducer";

const { Text } = Typography;

export default function RouteBuilder() {
  // Context dan ma'lumotlarni olish
  const { state, dispatch } = useTrip();
  const { route, femaleMode } = state;

  // --- State (Holatlar) ---
  const [fromRegionId, setFromRegionId] = useState(route?.fromRegionId || null);
  const [fromDistrict, setFromDistrict] = useState(route?.fromDistrict || "");
  const [toRegionId, setToRegionId] = useState(route?.toRegionId || null);
  const [toDistrict, setToDistrict] = useState(route?.toDistrict || "");

  const [departPointOpen, setDepartPointOpen] = useState(false);
  const [departLatLng, setDepartLatLng] = useState(route?.departLatLng || null);

  // Region nomlarini olish
  const fromRegion = useMemo(() => getRegionById(fromRegionId), [fromRegionId]);
  const toRegion = useMemo(() => getRegionById(toRegionId), [toRegionId]);

  // Marshrutni saqlash funksiyasi
  const applyRouteFromSelectors = () => {
    const fromText = formatRegionDistrict(fromRegion?.name || "", fromDistrict);
    const toText = formatRegionDistrict(toRegion?.name || "", toDistrict);

    dispatch({
      type: "SET_ROUTE",
      payload: {
        ...route,
        from: fromText,
        to: toText,
        fromRegionId,
        fromDistrict,
        toRegionId,
        toDistrict,
        departLatLng, // Xaritadan olingan nuqta
      },
    });
  };

  // O'zgarishlarni kuzatish va saqlash
  useEffect(() => {
    applyRouteFromSelectors();
    // eslint-disable-next-line
  }, [fromRegionId, fromDistrict, toRegionId, toDistrict, departLatLng]);

  // Ayollar rejimi variantlari
  const femaleOptions = [
    { label: "Muhim emas", value: FEMALE_MODE.NONE },
    { label: "Faqat ayollar", value: FEMALE_MODE.ONLY_FEMALE },
    { label: "Ayol oilasi bilan", value: FEMALE_MODE.FEMALE_WITH_FAMILY },
  ];
  const femaleValue = femaleMode || FEMALE_MODE.NONE;

  // --- RENDER (Tuzatilgan qism) ---
  return (
    <> {/* <--- FRAGMENT OCHILDI (MUHIM!) */}
      <Card style={{ borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          
          {/* Sarlavha */}
          <Space>
            <EnvironmentOutlined style={{ color: "#1890ff" }} />
            <Text strong>Reys yo'nalishi</Text>
          </Space>

          {/* QAYERDAN */}
          <div>
            <div style={{ marginBottom: 6, fontWeight: 600 }}>Qayerdan (Viloyat / Tuman)</div>
            <RegionDistrictSelect
              regionId={fromRegionId}
              districtName={fromDistrict}
              onChange={(r, d) => {
                setFromRegionId(r);
                setFromDistrict(d);
              }}
            />
          </div>

          {/* QAYERGA */}
          <div>
            <div style={{ marginBottom: 6, fontWeight: 600 }}>Qayerga (Viloyat / Tuman)</div>
            <RegionDistrictSelect
              regionId={toRegionId}
              districtName={toDistrict}
              onChange={(r, d) => {
                setToRegionId(r);
                setToDistrict(d);
              }}
            />
          </div>

          {/* XARITADAN BELGILASH TUGMASI */}
          <div style={{ marginTop: 12 }}>
            <Button onClick={() => setDepartPointOpen(true)} block>
              Jo‘nab ketish manzilini xaritadan belgilash
            </Button>
            {departLatLng ? (
              <Text type="secondary" style={{ display: "block", marginTop: 6 }}>
                Belgilandi: {departLatLng[0].toFixed(6)}, {departLatLng[1].toFixed(6)}
              </Text>
            ) : null}
          </div>

          {/* AYOLLAR REJIMI KARTASI */}
          <Card
            style={{ borderRadius: 14, background: "#fff0f6", border: "1px solid #ffadd2", marginTop: 10 }}
            bodyStyle={{ padding: 12 }}
          >
            <Space style={{ width: "100%", justifyContent: "space-between" }}>
              <Space>
                <WomanOutlined style={{ color: "#eb2f96" }} />
                <Text strong>Ayollar uchun rejim</Text>
              </Space>
              <Select
                value={femaleValue}
                options={femaleOptions}
                onChange={(v) => dispatch({ type: "SET_FEMALE_MODE", mode: v })}
                style={{ minWidth: 160 }}
              />
            </Space>
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 4 }}>
              Agar faqat ayollar yoki oilaviy bo‘lsa belgilang
            </Text>
          </Card>
        </Space>
      </Card>

      {/* MODAL: Xaritadan joy tanlash */}
      <Modal
        open={departPointOpen}
        title="Jo‘nab ketish manzilini tanlang"
        onCancel={() => setDepartPointOpen(false)}
        onOk={() => setDepartPointOpen(false)}
        okText="Tayyor"
        cancelText="Bekor"
        width={720}
        destroyOnClose
        centered
      >
        <div style={{ height: 400, width: "100%", position: "relative" }}>
          {/* Xarita komponenti */}
          <MapContainer
            center={departLatLng || [41.311, 69.24]}
            zoom={6}
            style={{ width: "100%", height: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapCenterPicker
              onCenterChange={(lat, lng) => setDepartLatLng([lat, lng])}
              initialCenter={departLatLng}
            />
          </MapContainer>
          
          {/* Markazni ko'rsatuvchi pin */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -100%)",
              zIndex: 999,
              pointerEvents: "none",
            }}
          >
            <EnvironmentOutlined style={{ fontSize: 32, color: "red" }} />
          </div>
        </div>
        
        <div style={{ marginTop: 10, textAlign: "center" }}>
          {departLatLng
            ? `Tanlandi: ${departLatLng[0].toFixed(5)}, ${departLatLng[1].toFixed(5)}`
            : "Xaritani suring va markazni belgilang"}
        </div>
      </Modal>
    </> {/* <--- FRAGMENT YOPILDI (MUHIM!) */}
  );
}