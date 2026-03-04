import React, { useEffect, useMemo, useState } from "react";
import { Button, Col, DatePicker, Divider, Form, Input, InputNumber, Modal, Row, Select, Switch, message } from "antd";
import dayjs from "dayjs";
import { supabase } from "@/lib/supabase";
import { listPitaks, createTrip } from "@/features/shared/interDistrictTrips";
import { districtData } from "../../services/districtData";

const { TextArea } = Input;

const MODES = [
  { value: "pitak", label: "Standart (Pitak)" },
  { value: "door", label: "Manzildan manzilga" },
];

export default function TripCreateModal({ open, onClose, onCreated }) {
  const [loading, setLoading] = useState(false);
  const [pitaks, setPitaks] = useState([]);
  const [region, setRegion] = useState("");
  const [form] = Form.useForm();

  const regions = useMemo(() => {
    // districtData may include regions
    const list = districtData?.regions || districtData?.REGIONS || districtData?.regionList || [];
    if (Array.isArray(list) && list.length) return list;
    // fallback: build from districts map
    const dmap = districtData?.districtsByRegion || {};
    return Object.keys(dmap);
  }, []);

  const districts = useMemo(() => {
    const dmap = districtData?.districtsByRegion || {};
    if (!region) return [];
    return (dmap[region] || []).map((d) => ({ value: d, label: d }));
  }, [region]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        // preload region from first
        const r0 = regions?.[0] || "";
        setRegion(r0);
        const { data } = await listPitaks({ region: r0, isActive: true });
        setPitaks(data || []);
      } catch {
        setPitaks([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        if (!region) return;
        const { data } = await listPitaks({ region, isActive: true });
        setPitaks(data || []);
      } catch {
        setPitaks([]);
      }
    })();
  }, [open, region]);

  const onSubmit = async () => {
    const v = await form.validateFields();
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) throw new Error("Login bo‘ling");

      const departAt = v.depart_at?.toISOString?.() || dayjs(v.depart_at).toISOString();

      const payload = {
        driver_id: uid,
        mode: v.mode,
        region: v.region,
        from_district: v.from_district,
        to_district: v.to_district,
        pitak_id: v.mode === "pitak" ? (v.pitak_id || null) : null,
        depart_at: departAt,
        seats_total: Number(v.seats_total || 4),
        seats_available: Number(v.seats_total || 4),
        base_price_uzs: Number(v.base_price_uzs || 0),
        pickup_fee_uzs: Number(v.pickup_fee_uzs || 0),
        dropoff_fee_uzs: Number(v.dropoff_fee_uzs || 0),
        allow_full_salon: !!v.allow_full_salon,
        full_salon_price_uzs: Number(v.full_salon_price_uzs || 0),
        has_ac: !!v.has_ac,
        has_trunk: !!v.has_trunk,
        is_lux: !!v.is_lux,
        allow_smoking: !!v.allow_smoking,
        has_delivery: !!v.has_delivery,
        delivery_price_uzs: Number(v.delivery_price_uzs || 0),
        notes: v.notes || null,
      };

      const { error } = await createTrip(payload);
      if (error) throw error;

      message.success("Reys yaratildi");
      form.resetFields();
      onCreated?.();
      onClose?.();
    } catch (e) {
      message.error(e?.message || "Xato");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Reys yaratish (Haydovchi)"
      width={920}
      footer={[
        <Button key="cancel" onClick={onClose}>Bekor</Button>,
        <Button key="ok" type="primary" loading={loading} onClick={onSubmit}>Saqlash</Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          mode: "pitak",
          region: regions?.[0] || "",
          seats_total: 4,
          base_price_uzs: 0,
          pickup_fee_uzs: 0,
          dropoff_fee_uzs: 0,
          allow_full_salon: false,
          full_salon_price_uzs: 0,
          has_ac: false,
          has_trunk: false,
          is_lux: false,
          allow_smoking: false,
          has_delivery: false,
          delivery_price_uzs: 0,
          depart_at: dayjs().add(1, "hour"),
        }}
        onValuesChange={(changed, all) => {
          if (changed.region) setRegion(changed.region);
        }}
      >
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="mode" label="Tarif" rules={[{ required: true }]}>
              <Select options={MODES} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="region" label="Hudud (viloyat)" rules={[{ required: true }]}>
              <Select options={(regions || []).map((r) => ({ value: r, label: r }))} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="from_district" label="Qaerdan (tuman)" rules={[{ required: true }]}>
              <Select options={districts} showSearch />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="to_district" label="Qaerga (tuman)" rules={[{ required: true }]}>
              <Select options={districts} showSearch />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item shouldUpdate noStyle>
              {({ getFieldValue }) =>
                getFieldValue("mode") === "pitak" ? (
                  <Form.Item name="pitak_id" label="Pitak (admin kiritgan joy)" rules={[{ required: false }]}>
                    <Select
                      allowClear
                      placeholder="Masalan: Avtovokzal"
                      options={(pitaks || []).map((p) => ({ value: p.id, label: p.name }))}
                    />
                  </Form.Item>
                ) : (
                  <div style={{ opacity: 0.85, marginBottom: 8 }}>
                    Manzildan manzilga rejim: mijoz so‘rovda o‘z manzilini yuboradi (pickup/dropoff).
                  </div>
                )
              }
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="depart_at" label="Ketish vaqti" rules={[{ required: true }]}>
              <DatePicker showTime style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="seats_total" label="O‘rindiqlar soni" rules={[{ required: true }]}>
              <InputNumber min={1} max={12} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        <Row gutter={12}>
          <Col span={8}>
            <Form.Item name="base_price_uzs" label="Yo‘l haqi (UZS)" rules={[{ required: true }]}>
              <InputNumber min={0} step={1000} style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item name="pickup_fee_uzs" label="Uyidan olib ketish (UZS)">
              <InputNumber min={0} step={1000} style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item name="dropoff_fee_uzs" label="Uyiga olib borish (UZS)">
              <InputNumber min={0} step={1000} style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="allow_full_salon" label="Polni salon" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item shouldUpdate noStyle>
              {({ getFieldValue }) =>
                getFieldValue("allow_full_salon") ? (
                  <Form.Item name="full_salon_price_uzs" label="Polni salon narxi (UZS)" rules={[{ required: true }]}>
                    <InputNumber min={0} step={1000} style={{ width: "100%" }} />
                  </Form.Item>
                ) : null
              }
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        <Row gutter={12}>
          <Col span={6}>
            <Form.Item name="has_ac" label="Konditsioner" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="has_trunk" label="Yukxona" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="is_lux" label="Salon lux" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="allow_smoking" label="Sigaret mumkin" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="has_delivery" label="Eltish xizmati" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="delivery_price_uzs" label="Eltish narxi (UZS)">
              <InputNumber min={0} step={1000} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="notes" label="Izoh (ixtiyoriy)">
          <TextArea rows={3} placeholder="Masalan: 2 ta joy bo‘sh, bagaj bor." />
        </Form.Item>
      </Form>
    </Modal>
  );
}
