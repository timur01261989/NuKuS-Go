import React, { useEffect, useMemo, useState } from "react";
import { Modal, Form, Select, InputNumber, Switch, Input, DatePicker, TimePicker, Space, Typography, message, Checkbox, Divider } from "antd";
import dayjs from "dayjs";
import { REGIONS, getDistrictsByRegion } from "@/features/client/interDistrict/services/districtData";
import { createTrip, listPitaks } from "@/features/shared/interDistrictTrips";

/**
 * TripCreateModal.jsx (Driver)
 * -------------------------------------------------------
 * Driver reys yaratadi:
 * - Standart (Pitak): pitak tanlash + yo‘l haqi + vaqt
 * - Manzildan manzilga: seats + tariflar (pickup/dropoff/full salon) + optionlar + eltish
 */
export default function TripCreateModal({ open, onClose, isOnline = true }) {
  const [form] = Form.useForm();
  const [tariff, setTariff] = useState("pitak");

  const regionId = Form.useWatch("region", form);
  const fromDistrict = Form.useWatch("from_district", form);
  const toDistrict = Form.useWatch("to_district", form);

  const districts = useMemo(() => getDistrictsByRegion(regionId || "karakalpakstan"), [regionId]);
  const districtOptions = useMemo(() => districts.map((d) => ({ value: d.name, label: d.name })), [districts]);

  const [pitaks, setPitaks] = useState([]);
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const list = await listPitaks({ region: regionId, from_district: fromDistrict, to_district: toDistrict, activeOnly: true });
        setPitaks(list || []);
      } catch (_) {
        setPitaks([]);
      }
    })();
  }, [open, regionId, fromDistrict, toDistrict]);

  useEffect(() => {
    if (!open) return;
    // defaults
    form.setFieldsValue({
      region: "karakalpakstan",
      tariff: "pitak",
      depart_date: dayjs(),
      depart_time: dayjs().add(1, "hour"),
      base_price_uzs: 50000,
      pickup_fee_uzs: 0,
      dropoff_fee_uzs: 0,
      allow_full_salon: false,
      has_ac: false,
      has_trunk: false,
      is_lux: false,
      allow_smoking: false,
      has_delivery: false,
      pickup_modes: ['station'],
    });
    setTariff("pitak");
  }, [open]);

  const onOk = async () => {
    if (!isOnline) {
      message.warning('Avval Online bo‘ling');
      return;
    }
    try {
      const v = await form.validateFields();
      const depart_at = new Date(`${v.depart_date.format("YYYY-MM-DD")}T${v.depart_time.format("HH:mm")}:00`).toISOString();

      const payload = {
        region: v.region,
        from_district: v.from_district,
        to_district: v.to_district,
        tariff: v.tariff,
        pitak_id: v.tariff === "pitak" ? (v.pitak_id || null) : null,
        depart_at,
        seats_total: v.tariff === "door" ? Number(v.seats_total || 0) : null,
        allow_full_salon: v.tariff === "door" ? !!v.allow_full_salon : false,
        base_price_uzs: Number(v.base_price_uzs || 0),
        pickup_fee_uzs: v.tariff === "door" ? Number(v.pickup_fee_uzs || 0) : 0,
        dropoff_fee_uzs: v.tariff === "door" ? Number(v.dropoff_fee_uzs || 0) : 0,
        full_salon_price_uzs: v.tariff === "door" && v.allow_full_salon ? Number(v.full_salon_price_uzs || 0) : null,
        has_ac: !!v.has_ac,
        has_trunk: !!v.has_trunk,
        is_lux: !!v.is_lux,
        allow_smoking: !!v.allow_smoking,
        has_delivery: !!v.has_delivery || (Array.isArray(v.pickup_modes) && v.pickup_modes.includes('parcel')),
        delivery_price_uzs: (v.has_delivery || (Array.isArray(v.pickup_modes) && v.pickup_modes.includes('parcel'))) ? Number(v.delivery_price_uzs || 0) : null,
        notes: (() => {
          const base = v.notes ? String(v.notes) : '';
          const modes = Array.isArray(v.pickup_modes) ? v.pickup_modes : [];
          const meta = { pickup_modes: modes };
          const tag = `\n---\nMETA:${JSON.stringify(meta)}`;
          return (base || modes.length) ? (base + tag) : null;
        })(),
      };

      await createTrip(payload);
      message.success("Reys yaratildi");
      onClose?.();
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.message || "Xatolik: reys yaratilmadi");
    }
  };

  return (
    <Modal
      title="Reys yaratish (Tumanlar aro)"
      open={open}
      onOk={onOk}
      onCancel={onClose}
      okText="Saqlash"
      cancelText="Bekor"
      width={560}
    >
      <Form layout="vertical" form={form}>
        <Form.Item name="region" label="Hudud" rules={[{ required: true }]}>
          <Select options={REGIONS.map((r) => ({ value: r.id, label: r.name }))} />
        </Form.Item>

        <Space style={{ width: "100%" }} size={10}>
          <Form.Item name="from_district" label="Qaerdan (tuman)" rules={[{ required: true }]} style={{ flex: 1 }}>
            <Select options={districtOptions} placeholder="Tanlang" />
          </Form.Item>
          <Form.Item name="to_district" label="Qaerga (tuman)" rules={[{ required: true }]} style={{ flex: 1 }}>
            <Select options={districtOptions} placeholder="Tanlang" />
          </Form.Item>
        </Space>

        <Divider style={{ margin: '10px 0' }} />
        <Form.Item
          name="pickup_modes"
          label="Yo‘lovchilarni qayerdan olasiz?"
          rules={[{ required: true, message: 'Kamida bitta variant tanlang' }]}
        >
          <Checkbox.Group
            options={[
              { label: 'Uylardan yig\'ish', value: 'home' },
              { label: 'Vokzal / Stoyanka', value: 'station' },
              { label: 'Yo\'l-yo\'lakay', value: 'road' },
              { label: 'Pochta / Posilka ham olaman', value: 'parcel' },
            ]}
          />
        </Form.Item>

        <Form.Item name="tariff" label="Tarif turi" rules={[{ required: true }]}>
          <Select
            value={tariff}
            onChange={(v) => {
              setTariff(v);
              form.setFieldsValue({ tariff: v });
            }}
            options={[
              { value: "pitak", label: "Standart (Pitak)" },
              { value: "door", label: "Manzildan manzilga" },
            ]}
          />
        </Form.Item>

        <Space style={{ width: "100%" }} size={10}>
          <Form.Item name="depart_date" label="Sana" rules={[{ required: true }]} style={{ flex: 1 }}>
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="depart_time" label="Soat" rules={[{ required: true }]} style={{ flex: 1 }}>
            <TimePicker format="HH:mm" style={{ width: "100%" }} />
          </Form.Item>
        </Space>

        {tariff === "pitak" ? (
          <>
            <Typography.Text style={{ fontWeight: 700 }}>Pitak (admin kiritgan)</Typography.Text>
            <Form.Item name="pitak_id" style={{ marginTop: 8 }} rules={[{ required: true, message: "Pitak tanlang" }]}>
              <Select
                placeholder="Pitak tanlang"
                options={pitaks.map((p) => ({ value: p.id, label: p.title }))}
              />
            </Form.Item>

            <Form.Item name="base_price_uzs" label="Yo‘l haqi (so‘m)" rules={[{ required: true }]}>
              <InputNumber style={{ width: "100%" }} min={0} step={1000} />
            </Form.Item>
          </>
        ) : (
          <>
            <Space style={{ width: "100%" }} size={10}>
              <Form.Item name="seats_total" label="O‘rindiqlar soni" rules={[{ required: true }]} style={{ flex: 1 }}>
                <InputNumber style={{ width: "100%" }} min={1} max={8} />
              </Form.Item>
              <Form.Item name="base_price_uzs" label="Bazaviy narx (so‘m)" rules={[{ required: true }]} style={{ flex: 1 }}>
                <InputNumber style={{ width: "100%" }} min={0} step={1000} />
              </Form.Item>
            </Space>

            <Space style={{ width: "100%" }} size={10}>
              <Form.Item name="pickup_fee_uzs" label="Uyidan olib ketish (so‘m)" style={{ flex: 1 }}>
                <InputNumber style={{ width: "100%" }} min={0} step={1000} />
              </Form.Item>
              <Form.Item name="dropoff_fee_uzs" label="Uyiga olib borish (so‘m)" style={{ flex: 1 }}>
                <InputNumber style={{ width: "100%" }} min={0} step={1000} />
              </Form.Item>
            </Space>

            <Form.Item name="allow_full_salon" valuePropName="checked">
              <Switch /> <span style={{ marginLeft: 8 }}>Butun salon</span>
            </Form.Item>

            {Form.useWatch("allow_full_salon", form) && (
              <Form.Item name="full_salon_price_uzs" label="Butun salon narxi (so‘m)" rules={[{ required: true }]}>
                <InputNumber style={{ width: "100%" }} min={0} step={1000} />
              </Form.Item>
            )}
          </>
        )}

        <Space wrap style={{ width: "100%" }}>
          <Form.Item name="has_ac" valuePropName="checked" style={{ marginBottom: 0 }}>
            <Switch /> <span style={{ marginLeft: 8 }}>Konditsioner</span>
          </Form.Item>
          <Form.Item name="has_trunk" valuePropName="checked" style={{ marginBottom: 0 }}>
            <Switch /> <span style={{ marginLeft: 8 }}>Yukxona</span>
          </Form.Item>
          <Form.Item name="is_lux" valuePropName="checked" style={{ marginBottom: 0 }}>
            <Switch /> <span style={{ marginLeft: 8 }}>Luks</span>
          </Form.Item>
          <Form.Item name="allow_smoking" valuePropName="checked" style={{ marginBottom: 0 }}>
            <Switch /> <span style={{ marginLeft: 8 }}>Sigaret</span>
          </Form.Item>
        </Space>

        <div style={{ marginTop: 10 }}>
          <Form.Item name="has_delivery" valuePropName="checked" style={{ marginBottom: 0 }}>
            <Switch /> <span style={{ marginLeft: 8 }}>Eltish (posilka) qo‘shish</span>
          </Form.Item>
          {Form.useWatch("has_delivery", form) && (
            <Form.Item name="delivery_price_uzs" label="Eltish narxi (so‘m)" rules={[{ required: true }]}>
              <InputNumber style={{ width: "100%" }} min={0} step={1000} />
            </Form.Item>
          )}
        </div>

        <Form.Item name="notes" label="Izoh (ixtiyoriy)">
          <Input.TextArea rows={3} placeholder="Masalan: avtovokzal oldidan, 1 ta yuk, luks salon..." />
        </Form.Item>
      </Form>
    </Modal>
  );
}
