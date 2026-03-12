import React, { useState, useEffect, useMemo } from "react";
import { Modal, Form, Input, InputNumber, Switch, DatePicker, TimePicker, Select, Button, Typography, Space, Divider, message, Row, Col, Card } from "antd";
import { CarOutlined, SafetyCertificateOutlined, InboxOutlined, SettingOutlined, AppstoreAddOutlined, ReconciliationOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { REGIONS, getDistrictsByRegion } from "../../services/districtData";

/**
 * TripCreateModal.jsx (Driver)
 * -------------------------------------------------------
 * Haydovchi yangi reys yaratishi uchun oyna.
 * - Eltish va Yuk qabul qilish xizmatlari alohida kiritildi
 * - Faqat ayollar uchun (Gender) qatnov rejimi
 * - Butun salon va qatnov narxlarini aniq ko'rsatish
 */
export default function TripCreateModal({
  open,
  onClose,
  onSuccess,
  passengerEnabled = true,
  deliveryEnabled = true,
  freightEnabled = true,
  activeVehicle = null,
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  
  // State'lar
  const [regionId, setRegionId] = useState("karakalpakstan");
  const [tariff, setTariff] = useState("door"); // 'door' yoki 'pitak'
  const [allowFullSalon, setAllowFullSalon] = useState(false);
  
  // Yangi Eltish va Yuk state'lari
  const [hasEltish, setHasEltish] = useState(false);
  const [hasYuk, setHasYuk] = useState(false);
  const activeMaxWeightKg = useMemo(() => Number(activeVehicle?.maxWeightKg || 0), [activeVehicle]);
  const activeMaxVolumeM3 = useMemo(() => Number(activeVehicle?.maxVolumeM3 || 0), [activeVehicle]);

  // Tumanlar ro'yxatini regionga qarab olish
  const districts = useMemo(() => getDistrictsByRegion(regionId), [regionId]);
  const optionsRegion = useMemo(() => REGIONS.map((r) => ({ value: r.id, label: r.name })), []);
  const optionsDistrict = useMemo(() => districts.map((d) => ({ value: d.name, label: d.name })), [districts]);

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({
        region: "karakalpakstan",
        tariff: "door",
        departDate: dayjs(),
        departTime: dayjs().add(1, "hour"),
        seats_total: 4,
        allow_full_salon: false,
        has_eltish: false,
        has_yuk: false,
        female_only: false,
        has_ac: false,
        has_trunk: false,
        is_lux: false,
      });
      setRegionId("karakalpakstan");
      setTariff("door");
      setAllowFullSalon(false);
      setHasEltish(false);
      setHasYuk(false);
    }
  }, [open, form]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (!passengerEnabled) {
        message.error("Tumanlararo yo‘lovchi xizmati Sozlamalarda yoqilmagan.");
        return;
      }
      if (values.has_eltish && !deliveryEnabled) {
        message.error("Tumanlararo eltish xizmati yoqilmagan.");
        return;
      }
      if (values.has_yuk && !freightEnabled) {
        message.error("Tumanlararo yuk tashish xizmati yoqilmagan.");
        return;
      }

      // Sana va vaqtni bitta ISO string holatiga keltirish
      const departDateStr = values.departDate.format("YYYY-MM-DD");
      const departTimeStr = values.departTime.format("HH:mm");
      const departAtIso = new Date(`${departDateStr}T${departTimeStr}:00`).toISOString();

      // API (Backend) ga yuboriladigan payload
      const payload = {
        from_district: values.from_district,
        to_district: values.to_district,
        depart_at: departAtIso,
        tariff: values.tariff,
        base_price_uzs: values.base_price_uzs,
        pickup_fee_uzs: values.pickup_fee_uzs || 0,
        dropoff_fee_uzs: values.dropoff_fee_uzs || 0,
        seats_total: values.seats_total || 4,
        allow_full_salon: values.allow_full_salon,
        full_salon_price_uzs: values.allow_full_salon ? values.full_salon_price_uzs : null,
        
        // Eltish va Yuk ma'lumotlari
        has_eltish: values.has_eltish,
        eltish_price_uzs: values.has_eltish ? values.eltish_price_uzs : null,
        has_yuk: values.has_yuk,
        yuk_price_uzs: values.has_yuk ? values.yuk_price_uzs : null,
        
        female_only: values.female_only,
        has_ac: values.has_ac,
        has_trunk: values.has_trunk,
        is_lux: values.is_lux,
        notes: values.notes || "",
        active_vehicle_id: activeVehicle?.id || null,
        active_vehicle_max_weight_kg: activeMaxWeightKg || null,
        active_vehicle_max_volume_m3: activeMaxVolumeM3 || null,
      };

      // Bu yerda sizning api call funksiyangiz ishlaydi
      // await createInterDistrictTrip(payload);
      
      message.success("Reys muvaffaqiyatli yaratildi!");
      onSuccess?.(payload);
      onClose();
    } catch (error) {
      message.error("Reys yaratishda xatolik yuz berdi.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<Typography.Title level={4} style={{ margin: 0 }}>Yangi reys yaratish</Typography.Title>}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={600}
      bodyStyle={{ padding: "20px 24px", maxHeight: "85vh", overflowY: "auto" }}
    >
      <Form layout="vertical" form={form} onFinish={handleSubmit}>
        
        {/* HUDUD VA TUMANLAR */}
        <Card size="small" style={{ borderRadius: 12, marginBottom: 16, background: "#f8f9fa" }}>
          <Form.Item name="region" label={<span style={{ fontWeight: 600 }}>Hududni tanlang</span>} initialValue="karakalpakstan">
            <Select 
              size="large" 
              options={optionsRegion} 
              onChange={(val) => {
                setRegionId(val);
                form.setFieldsValue({ from_district: null, to_district: null });
              }} 
            />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="from_district" label="Qaerdan" rules={[{ required: true, message: "Manzilni tanlang" }]}>
                <Select size="large" options={optionsDistrict} placeholder="Tuman" showSearch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="to_district" label="Qaerga" rules={[{ required: true, message: "Manzilni tanlang" }]}>
                <Select size="large" options={optionsDistrict} placeholder="Tuman" showSearch />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* VAQT VA TARIF */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="departDate" label={<span style={{ fontWeight: 600 }}>Ketish sanasi</span>} rules={[{ required: true }]}>
              <DatePicker style={{ width: "100%" }} size="large" allowClear={false} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="departTime" label={<span style={{ fontWeight: 600 }}>Ketish vaqti</span>} rules={[{ required: true }]}>
              <TimePicker format="HH:mm" style={{ width: "100%" }} size="large" allowClear={false} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="tariff" label={<span style={{ fontWeight: 600 }}>Xizmat turi (Tarif)</span>}>
          <Select 
            size="large" 
            onChange={setTariff}
            options={[
              { value: "door", label: "🚕 Manzildan manzilgacha (Door-to-door)" },
              { value: "pitak", label: "📍 Stoyanka / Pitakdan" }
            ]}
          />
        </Form.Item>

        {/* NARXLAR */}
        <Card size="small" style={{ borderRadius: 12, marginBottom: 16, border: "1px solid #e8e8e8" }}>
          <Typography.Text style={{ fontWeight: 700, fontSize: 15, display: "block", marginBottom: 10 }}>
            Narxlarni belgilash (so'm)
          </Typography.Text>
          <Form.Item name="base_price_uzs" label="1 ta o'rindiq narxi" rules={[{ required: true, message: "Narxni kiriting" }]}>
            <InputNumber 
              style={{ width: "100%" }} 
              size="large" 
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} 
              parser={value => value.replace(/\$\s?|( *)/g, '')} 
              placeholder="Masalan: 50 000" 
            />
          </Form.Item>

          {tariff === "door" && (
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="pickup_fee_uzs" label="Uyidan olish narxi">
                  <InputNumber style={{ width: "100%" }} size="large" placeholder="10 000" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="dropoff_fee_uzs" label="Uyiga borish narxi">
                  <InputNumber style={{ width: "100%" }} size="large" placeholder="10 000" />
                </Form.Item>
              </Col>
            </Row>
          )}

          {tariff === "door" && (
            <>
              <Form.Item name="allow_full_salon" valuePropName="checked" style={{ marginBottom: 8 }}>
                <Switch checked={allowFullSalon} onChange={setAllowFullSalon} />
                <span style={{ marginLeft: 10, fontWeight: 600 }}>Butun salonni band qilishga ruxsat</span>
              </Form.Item>
              {allowFullSalon && (
                <Form.Item name="full_salon_price_uzs" rules={[{ required: true, message: "Butun salon narxini kiriting" }]}>
                  <InputNumber style={{ width: "100%" }} size="large" placeholder="Butun salon uchun chegirmali narx" />
                </Form.Item>
              )}
            </>
          )}
        </Card>

        {/* XIZMATLAR: ELTISH VA YUK */}
        <Card size="small" style={{ borderRadius: 12, marginBottom: 16, background: "rgba(22, 119, 255, 0.05)", border: "1px solid rgba(22, 119, 255, 0.2)" }}>
          <Space direction="vertical" style={{ width: "100%" }}>
            
            {/* Eltish (Pochta) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Space align="center">
                <InboxOutlined style={{ fontSize: 20, color: "#1677ff" }} />
                <span style={{ fontWeight: 600, color: "#333" }}>Eltish (Pochta) qabul qilaman {!deliveryEnabled ? "(Sozlamada o‘chiq)" : ""}</span>
              </Space>
              <Form.Item name="has_eltish" valuePropName="checked" style={{ margin: 0 }}>
                <Switch disabled={!deliveryEnabled} checked={hasEltish} onChange={setHasEltish} />
              </Form.Item>
            </div>
            {hasEltish && (
              <>
              <Form.Item name="eltish_price_uzs" label="Eng kam eltish narxi" style={{ marginTop: 10, marginBottom: 10 }} rules={[{ required: true, message: "Eltish narxini kiriting" }]}>
                <InputNumber style={{ width: "100%" }} size="large" placeholder="15 000" />
              </Form.Item>
              </>
            )}

            <Divider style={{ margin: "12px 0" }} />

            {/* Yuk olaman */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Space align="center">
                <ReconciliationOutlined style={{ fontSize: 20, color: "#fa8c16" }} />
                <span style={{ fontWeight: 600, color: "#333" }}>Yuk olaman {!freightEnabled ? "(Sozlamada o‘chiq)" : ""}</span>
              </Space>
              <Form.Item name="has_yuk" valuePropName="checked" style={{ margin: 0 }}>
                <Switch disabled={!freightEnabled} checked={hasYuk} onChange={setHasYuk} />
              </Form.Item>
            </div>
            {hasYuk && (
              <>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 10 }}>Aktiv mashina limiti: {activeMaxWeightKg || 0}kg • {activeMaxVolumeM3 || 0}m³</div>
              <Form.Item name="yuk_price_uzs" label="Eng kam yuk narxi" style={{ marginTop: 10, marginBottom: 0 }} rules={[{ required: true, message: "Yuk narxini kiriting" }]}>
                <InputNumber style={{ width: "100%" }} size="large" placeholder="50 000" />
              </Form.Item>
              </>
            )}

          </Space>
        </Card>

        {/* QO'SHIMCHA QULAYLIKLAR */}
        <Typography.Text style={{ fontWeight: 700, fontSize: 15, display: "block", marginBottom: 10 }}>
          <SettingOutlined /> Qo'shimcha sozlamalar
        </Typography.Text>
        <Card size="small" style={{ borderRadius: 12, marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: "100%" }}>
            <Form.Item name="has_ac" valuePropName="checked" style={{ margin: 0 }}>
              <Switch /> <span style={{ marginLeft: 8 }}>❄️ Konditsioner bor</span>
            </Form.Item>
            <Form.Item name="has_trunk" valuePropName="checked" style={{ margin: 0 }}>
              <Switch /> <span style={{ marginLeft: 8 }}>🧳 Yukxona (Bagaj) bo'sh</span>
            </Form.Item>
            
            <Divider style={{ margin: "8px 0" }} />
            
            <Form.Item name="female_only" valuePropName="checked" style={{ margin: 0 }}>
              <Switch /> 
              <span style={{ marginLeft: 8, fontWeight: 600, color: "#eb2f96" }}>
                <SafetyCertificateOutlined /> Faqat ayollar uchun (Xavfsiz reys)
              </span>
            </Form.Item>
          </Space>
        </Card>

        <Form.Item name="notes" label="Qo'shimcha izoh">
          <Input.TextArea rows={2} placeholder="Mijozlar uchun ma'lumotlar (masalan: mashina rangi, markasi)..." />
        </Form.Item>

        <Button type="primary" htmlType="submit" loading={loading} style={{ width: "100%", height: 50, borderRadius: 14, fontWeight: 600, fontSize: 16 }}>
          Reysni e'lon qilish
        </Button>
      </Form>
    </Modal>
  );
}