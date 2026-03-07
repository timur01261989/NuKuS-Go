import React, { useMemo } from "react";
import { useClientText } from "../../../shared/i18n_clientLocalize";
import { Card, Col, Row, Select, Space, Switch, Typography, Button } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";
import { REGIONS, getDistrictsByRegion } from "../../services/districtData";
import { useDistrict } from "../../context/DistrictContext";

/**
 * DistrictList.jsx (Client)
 * -------------------------------------------------------
 * Talab:
 * 1) Hududni tanlang (Qoraqalpog‘iston + viloyatlar)
 * 2) "Qaerdan" -> tanlangan hudud tumanlari
 * 3) "Qaerga" -> shu hudud tumanlari
 * 4) cp("Manzildan manzilgacha") (door-to-door) switch:
 *    - pickup: avtomatik aniqlanadi (GPS), xaritadan o‘zgartirish mumkin
 *    - dropoff: ixtiyoriy (majburiy emas)
 */
export default function DistrictList({ onOpenPicker, onLocateMe }) {
  const { cp } = useClientText();
  const {
    regionId,
    setRegionId,
    fromDistrict,
    setFromDistrict,
    toDistrict,
    setToDistrict,
    doorToDoor,
    setDoorToDoor,
    pickupAddress,
    dropoffAddress,
  } = useDistrict();

  const districts = useMemo(() => getDistrictsByRegion(regionId), [regionId]);

  const optionsRegion = useMemo(
    () => REGIONS.map((r) => ({ value: r.id, label: r.name })),
    []
  );

  const optionsDistrict = useMemo(
    () => districts.map((d) => ({ value: d.name, label: d.name })),
    [districts]
  );

  return (
    <Card style={{ borderRadius: 18 }}>
      <Typography.Text style={{ fontWeight: 700 }}>Tumanlar aro</Typography.Text>

      <div style={{ marginTop: 12 }}>
        <Typography.Text style={{ fontSize: 12, opacity: 0.7 }}>Hududni tanlang</Typography.Text>
        <Select
          value={regionId}
          onChange={(v) => {
            setRegionId(v);
            setFromDistrict(null);
            setToDistrict(null);
          }}
          options={optionsRegion}
          style={{ width: "100%", marginTop: 6 }}
          size="large"
        />
      </div>

      <Row gutter={10} style={{ marginTop: 12 }}>
        <Col span={12}>
          <Typography.Text style={{ fontSize: 12, opacity: 0.7 }}>Qaerdan</Typography.Text>
          <Select
            value={fromDistrict}
            onChange={(v) => setFromDistrict(v)}
            options={optionsDistrict}
            placeholder="Tanlang"
            style={{ width: "100%", marginTop: 6 }}
            size="large"
          />
        </Col>
        <Col span={12}>
          <Typography.Text style={{ fontSize: 12, opacity: 0.7 }}>Qaerga</Typography.Text>
          <Select
            value={toDistrict}
            onChange={(v) => setToDistrict(v)}
            options={optionsDistrict}
            placeholder="Tanlang"
            style={{ width: "100%", marginTop: 6 }}
            size="large"
          />
        </Col>
      </Row>

      <div style={{ marginTop: 14 }}>
        <Space align="center" style={{ width: "100%", justifyContent: "space-between" }}>
          <Typography.Text style={{ fontWeight: 600 }}>Manzildan manzilgacha</Typography.Text>
          <Switch
            checked={doorToDoor}
            onChange={(v) => {
              setDoorToDoor(v);
              // door-to-door yoqilganda pickupni GPS bilan olishga harakat qilamiz
              if (v) onLocateMe?.();
            }}
          />
        </Space>
        <Typography.Text style={{ fontSize: 12, opacity: 0.7, display: "block", marginTop: 6 }}>
          Yoqilsa: siz turgan joy avtomatik aniqlanadi, xohlasangiz xaritadan o‘zgartirasiz.
          cp("Qaerga (manzil)") majburiy emas.
        </Typography.Text>
      </div>

      {doorToDoor && (
        <div style={{ marginTop: 12 }}>
          <Card size="small" style={{ borderRadius: 14, marginBottom: 10 }}>
            <Space style={{ width: "100%", justifyContent: "space-between" }}>
              <Space>
                <EnvironmentOutlined />
                <div>
                  <div style={{ fontWeight: 600 }}>Qaerdan (manzil)</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{pickupAddress || "Aniqlanmagan"}</div>
                </div>
              </Space>
              <Button onClick={() => onOpenPicker?.("pickup")} style={{ borderRadius: 12 }}>
                Xaritadan
              </Button>
            </Space>
          </Card>

          <Card size="small" style={{ borderRadius: 14 }}>
            <Space style={{ width: "100%", justifyContent: "space-between" }}>
              <Space>
                <EnvironmentOutlined />
                <div>
                  <div style={{ fontWeight: 600 }}>Qaerga (manzil)</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {dropoffAddress || cp("Ixtiyoriy (majburiy emas)")}
                  </div>
                </div>
              </Space>
              <Button onClick={() => onOpenPicker?.("dropoff")} style={{ borderRadius: 12 }}>
                Xaritadan
              </Button>
            </Space>
          </Card>
        </div>
      )}
    </Card>
  );
}