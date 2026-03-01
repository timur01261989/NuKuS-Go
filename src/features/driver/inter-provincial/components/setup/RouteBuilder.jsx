import React, { useMemo, useState } from "react";
import { Card, Input, Space, Tag, Typography, Switch, Select, Modal, Button } from "antd";
import { EnvironmentOutlined, WomanOutlined } from "@ant-design/icons";
import RegionDistrictSelect from "../../../../../components/RegionDistrictSelect";
import { getRegionById, formatRegionDistrict } from "../../../../../constants/uzLocations";
import { MapContainer, TileLayer } from "react-leaflet";
import MapCenterPicker from "../../../../map/components/MapCenterPicker";

import { useTrip } from "../../context/TripContext";
import { FEMALE_MODE } from "../../context/tripReducer";

const { Text } = Typography;

export default function RouteBuilder() {

  // --- Region/District selections (Viloyatlar aro) ---
  const [fromRegionId, setFromRegionId] = useState(route?.fromRegionId || null);
  const [fromDistrict, setFromDistrict] = useState(route?.fromDistrict || "");
  const [toRegionId, setToRegionId] = useState(route?.toRegionId || null);
  const [toDistrict, setToDistrict] = useState(route?.toDistrict || "");

  const [departPointOpen, setDepartPointOpen] = useState(false);
  const [departLatLng, setDepartLatLng] = useState(route?.departLatLng || null);

  const fromRegion = useMemo(() => getRegionById(fromRegionId), [fromRegionId]);
  const toRegion = useMemo(() => getRegionById(toRegionId), [toRegionId]);

  const applyRouteFromSelectors = () => {
    const fromText = formatRegionDistrict(fromRegion?.name || "", fromDistrict || "");
    const toText = formatRegionDistrict(toRegion?.name || "", toDistrict || "");
    onChange?.({
      ...route,
      fromRegionId,
      fromDistrict,
      toRegionId,
      toDistrict,
      from_region: fromRegion?.name || "",
      from_district: fromDistrict || "",
      to_region: toRegion?.name || "",
      to_district: toDistrict || "",
      from: fromText || route?.from || "",
      to: toText || route?.to || "",
      departLatLng: departLatLng || null,
    });
  };

  React.useEffect(() => {
    applyRouteFromSelectors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromRegionId, fromDistrict, toRegionId, toDistrict, departLatLng]);
  const { state, dispatch } = useTrip();
  const [from, setFrom] = useState(state.route.from);
  const [to, setTo] = useState(state.route.to);
  const [transit, setTransit] = useState(state.route.transit || []);

  const femaleValue = state.femaleMode;

  const femaleOptions = [
    { value: FEMALE_MODE.OFF, label: "O'chirilgan" },
    { value: FEMALE_MODE.ALL_FEMALE, label: "Faqat ayollar uchun" },
    { value: FEMALE_MODE.BACK_ONLY, label: "Orqa o'rindiq ayollar uchun" },
  ];

  const saveRoute = () => {
    dispatch({ type: "SET_ROUTE", route: { from, to, transit } });
  };

  const badge = useMemo(() => {
    if (femaleValue === FEMALE_MODE.ALL_FEMALE) return <Tag color="magenta">🚺 Female Only</Tag>;
    if (femaleValue === FEMALE_MODE.BACK_ONLY) return <Tag color="pink">🚺 Backseat Female</Tag>;
    return <Tag>Oddiy</Tag>;
  }, [femaleValue]);

  return (
    
      <Card style={{ marginBottom: 12 }}>
        <Typography.Text strong>Qayerdan / Qayerga (viloyat/tuman)</Typography.Text>
        <div style={{ marginTop: 10 }}>
          <RegionDistrictSelect
            regionId={fromRegionId}
            district={fromDistrict}
            onRegionChange={(id) => { setFromRegionId(id); setFromDistrict(""); }}
            onDistrictChange={(d) => setFromDistrict(d)}
            allowEmptyDistrict
            regionPlaceholder="Qayerdan (viloyat)"
            districtPlaceholder="Qayerdan (tuman - ixtiyoriy)"
          />
        </div>
        <div style={{ marginTop: 10 }}>
          <RegionDistrictSelect
            regionId={toRegionId}
            district={toDistrict}
            onRegionChange={(id) => { setToRegionId(id); setToDistrict(""); }}
            onDistrictChange={(d) => setToDistrict(d)}
            allowEmptyDistrict
            regionPlaceholder="Qayerga (viloyat)"
            districtPlaceholder="Qayerga (tuman - ixtiyoriy)"
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <Button onClick={() => setDepartPointOpen(true)} block>
            Jo‘nab ketish manzilini xaritadan belgilash
          </Button>
          {departLatLng ? (
            <Typography.Text type="secondary" style={{ display: "block", marginTop: 6 }}>
              Belgilandi: {departLatLng[0].toFixed(6)}, {departLatLng[1].toFixed(6)}
            </Typography.Text>
          ) : null}
        </div>
      </Card>

      <Modal
        open={departPointOpen}
        title="Jo‘nab ketish manzilini tanlang"
        onCancel={() => setDepartPointOpen(false)}
        onOk={() => setDepartPointOpen(false)}
        okText="Tayyor"
        cancelText="Bekor"
        width={720}
      >
        <div style={{ height: 420, borderRadius: 12, overflow: "hidden" }}>
          <MapContainer
            center={departLatLng || [42.4602, 59.6156]}
            zoom={12}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
            <MapCenterPicker value={departLatLng || [42.4602, 59.6156]} onChange={(ll) => setDepartLatLng(ll)} />
          </MapContainer>
        </div>
        <Typography.Text type="secondary" style={{ display: "block", marginTop: 10 }}>
          Xarita markazini kerakli joyga olib borib belgilang.
        </Typography.Text>
      </Modal>
<Card style={{ borderRadius: 18 }}>
      <Space direction="vertical" size={10} style={{ width: "100%" }}>
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Space>
            <EnvironmentOutlined />
            <Text strong>Reys yo'nalishi</Text>
          </Space>
          {badge}
        </Space>

        <Input value={from} onChange={(e) => setFrom(e.target.value)} onBlur={saveRoute} placeholder="Qayerdan (masalan: Nukus)" />
        <Input value={to} onChange={(e) => setTo(e.target.value)} onBlur={saveRoute} placeholder="Qayerga (masalan: Toshkent)" />

        <Text type="secondary" style={{ fontSize: 12 }}>
          (Tranzit) Keyin qo'shamiz: Nukus → Buxoro → Samarqand kabi
        </Text>

        <Card style={{ borderRadius: 14, background: "#fff0f6", border: "1px solid #ffadd2" }} bodyStyle={{ padding: 12 }}>
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <Space>
              <WomanOutlined />
              <Text strong>Ayollar uchun rejim</Text>
            </Space>
            <Select
              value={femaleValue}
              options={femaleOptions}
              onChange={(v) => dispatch({ type: "SET_FEMALE_MODE", mode: v })}
              style={{ minWidth: 220 }}
            />
          </Space>
          <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 6 }}>
            * Erkaklar female-only joylarni band qila olmaydi (klient tomonda tekshiriladi).
          </Text>
        </Card>
      </Space>
    </Card>
  );
}
