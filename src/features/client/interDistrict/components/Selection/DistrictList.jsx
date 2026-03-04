import React, { useMemo } from "react";
import { Card, Col, Row, Select, Typography } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";
import { REGIONS, getDistrictNamesByRegion } from "../../services/districtData";
import { useDistrict } from "../../context/DistrictContext";

/**
 * DistrictList.jsx
 * -------------------------------------------------------
 * Client (Tumanlar aro) tanlash:
 * - Hudud (viloyat) tanlash
 * - Qaerdan (tuman) tanlash
 * - Qaerga (tuman) tanlash
 *
 * Bu struktura keyin to'liq tumanlar ro'yxati bilan kengaytiriladi.
 */
export default function DistrictList() {
  const { region, setRegion, fromDistrict, setFromDistrict, toDistrict, setToDistrict } = useDistrict();

  const regionOptions = useMemo(() => (REGIONS || []).map((r) => ({ value: r, label: r })), []);

  const districtOptions = useMemo(() => {
    const list = getDistrictNamesByRegion(region) || [];
    return list.map((d) => ({ value: d, label: d }));
  }, [region]);

  return (
    <Card style={{ borderRadius: 16, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.10)" }}>
      <Typography.Title level={5} style={{ marginTop: 0 }}>
        <EnvironmentOutlined /> Hudud va tumanlar
      </Typography.Title>

      <Row gutter={[12, 12]}>
        <Col span={24}>
          <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>Hududni tanlang</div>
          <Select
            value={region || undefined}
            onChange={(v) => setRegion?.(v)}
            style={{ width: "100%" }}
            options={regionOptions}
            showSearch
            placeholder="Hududni tanlang"
          />
        </Col>

        <Col span={12}>
          <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>Qaerdan</div>
          <Select
            value={fromDistrict || undefined}
            onChange={(v) => setFromDistrict?.(v)}
            style={{ width: "100%" }}
            options={districtOptions}
            showSearch
            placeholder="Qayerdan (tuman)"
          />
        </Col>

        <Col span={12}>
          <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>Qaerga</div>
          <Select
            value={toDistrict || undefined}
            onChange={(v) => setToDistrict?.(v)}
            style={{ width: "100%" }}
            options={districtOptions}
            showSearch
            placeholder="Qayerga (tuman)"
          />
        </Col>
      </Row>
    </Card>
  );
}
