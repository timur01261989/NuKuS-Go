import React from "react";
import { Button, Card, Form, Input, InputNumber, Radio, Segmented, Space, Typography } from "antd";
import { EnvironmentOutlined, SendOutlined } from "@ant-design/icons";
import RegionDistrictSelect from "@/modules/shared/components/RegionDistrictSelect";
import { PhoneField } from "../DeliveryPage.helpers";

const { Title, Text } = Typography;

export default function DeliveryRequestForm({
  cp, editingId, price, serviceModes, serviceMode, setServiceMode,
  pickup, setPickup, pickupMode, setPickupMode, pickupLabel,
  dropoff, setDropoff, dropoffMode, setDropoffMode, dropoffLabel,
  openMap, parcelTypes, parcelType, setParcelType, needsWeight, parcelMeta, weightKg, setWeightKg,
  senderPhone, setSenderPhone, receiverName, setReceiverName, receiverPhone, setReceiverPhone,
  openContacts, comment, setComment, matchedTrip, canSubmit, loading, handleSubmit, resetForm,
}) {
  return (
    <Card className="unigo-surface-card" style={{ marginTop: 14, borderRadius: 24, background: "#ffffff", border: "1px solid rgba(87,119,255,0.12)", boxShadow: "0 18px 40px rgba(64,96,160,0.08)" }} styles={{ body: { padding: 18 } }}>
      <Space direction="vertical" size={14} style={{ width: "100%" }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>{editingId ? cp("Buyurtmani tahrirlash") : cp("Eltish xizmati")}</Title>
          <Text type="secondary">{cp("Shahar, tumanlar aro va viloyatlar aro eltish bir joyda boshqariladi.")}</Text>
        </div>

        <Segmented block value={serviceMode} onChange={setServiceMode} options={serviceModes.map((item) => ({ value: item.key, label: item.label }))} />

        <Card size="small" style={{ borderRadius: 18, background: "#f8fbff", border: "1px solid rgba(87,119,255,0.1)" }}>
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            <div style={{ fontWeight: 700 }}>{cp("Qaerdan olish")}</div>
            <RegionDistrictSelect region={pickup.region} district={pickup.district} onChange={(next) => setPickup((prev) => ({ ...prev, ...next }))} allowEmptyDistrict={serviceMode === "city"} />
            <Radio.Group value={pickupMode} onChange={(e) => setPickupMode(e.target.value)}>
              <Space direction="vertical">
                <Radio value="standard" disabled={serviceMode === "city"}>{cp("Standart nuqta")}</Radio>
                <Radio value="precise">{cp("Xaritadan aniq manzil")}</Radio>
              </Space>
            </Radio.Group>
            {pickupMode === "precise" ? <Button icon={<EnvironmentOutlined />} onClick={() => openMap("pickup")}>{pickup.point ? cp("Manzilni o‘zgartirish") : cp("Xaritadan tanlash")}</Button> : null}
            <Text type="secondary">{pickupLabel}</Text>
          </Space>
        </Card>

        <Card size="small" style={{ borderRadius: 18, background: "#f8fbff", border: "1px solid rgba(87,119,255,0.1)" }}>
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            <div style={{ fontWeight: 700 }}>{cp("Qaerga topshirish")}</div>
            <RegionDistrictSelect region={dropoff.region} district={dropoff.district} onChange={(next) => setDropoff((prev) => ({ ...prev, ...next }))} allowEmptyDistrict={serviceMode === "city"} />
            <Radio.Group value={dropoffMode} onChange={(e) => setDropoffMode(e.target.value)}>
              <Space direction="vertical">
                <Radio value="standard" disabled={serviceMode === "city"}>{cp("Standart nuqta")}</Radio>
                <Radio value="precise">{cp("Aniq manzil")}</Radio>
              </Space>
            </Radio.Group>
            {dropoffMode === "precise" ? <Button icon={<EnvironmentOutlined />} onClick={() => openMap("dropoff")}>{dropoff.point ? cp("Manzilni o‘zgartirish") : cp("Xaritadan tanlash")}</Button> : null}
            <Text type="secondary">{dropoffLabel}</Text>
          </Space>
        </Card>

        <Card size="small" style={{ borderRadius: 18, background: "#f8fbff", border: "1px solid rgba(87,119,255,0.1)" }}>
          <Form layout="vertical">
            <Form.Item label={cp("Buyum turi")} style={{ marginBottom: 12 }}>
              <Segmented block value={parcelType} onChange={setParcelType} options={parcelTypes.map((item) => ({ value: item.value, label: item.label }))} />
            </Form.Item>
            {needsWeight ? <Form.Item label={`${cp("Og‘irlik")} (maks: ${parcelMeta.maxKg} kg)`} style={{ marginBottom: 12 }}><InputNumber min={1} max={parcelMeta.maxKg} value={weightKg} onChange={setWeightKg} style={{ width: "100%" }} /></Form.Item> : null}
            <Form.Item label={cp("Jo‘natuvchi telefon")} style={{ marginBottom: 12 }}><PhoneField value={senderPhone} onChange={setSenderPhone} onSelectContact={() => openContacts("sender")} /></Form.Item>
            <Form.Item label={cp("Qabul qiluvchi ismi")} style={{ marginBottom: 12 }}><Input value={receiverName} onChange={(e) => setReceiverName(e.target.value)} placeholder={cp("Ism")} /></Form.Item>
            <Form.Item label={cp("Qabul qiluvchi telefon")} style={{ marginBottom: 12 }}><PhoneField value={receiverPhone} onChange={setReceiverPhone} onSelectContact={() => openContacts("receiver")} /></Form.Item>
            <Form.Item label={cp("Izoh")} style={{ marginBottom: 0 }}><Input.TextArea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={cp("Masalan: Toshkentda avtovokzalda kutib oladi")} /></Form.Item>
          </Form>
        </Card>

        {serviceMode === "region" ? (
          <Card size="small" style={{ borderRadius: 18 }}>
            <Space direction="vertical" size={6} style={{ width: "100%" }}>
              <div style={{ fontWeight: 700 }}>{cp("Mos viloyatlar aro reys")}</div>
              {matchedTrip ? <Text>{matchedTrip.from_region} {matchedTrip.from_district ? `• ${matchedTrip.from_district}` : ""} → {matchedTrip.to_region} {matchedTrip.to_district ? `• ${matchedTrip.to_district}` : ""}</Text> : <Text type="secondary">{cp("Hozircha mos reys topilmadi. Buyurtma baribir saqlanadi, haydovchi keyin qabul qilishi mumkin.")}</Text>}
            </Space>
          </Card>
        ) : null}

        <Card size="small" style={{ borderRadius: 18, background: "#fffdf0", border: "1px solid rgba(255,196,52,0.25)" }}>
          <Space direction="vertical" size={6} style={{ width: "100%" }}>
            <div style={{ fontWeight: 700 }}>{cp("Narx qanday hisoblandi")}</div>
            <Text>{cp("Asosiy tarif + olish rejimi + topshirish rejimi + buyum turi.")}</Text>
            <Text>{cp("Komissiya faqat ko‘rsatilgan narxdan olinadi. To‘lov usuli: naqd.")}</Text>
          </Space>
        </Card>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button type="primary" size="large" icon={<SendOutlined />} disabled={!canSubmit} loading={loading} onClick={handleSubmit} style={{ borderRadius: 18, height: 52, fontWeight: 800, flex: 1, minWidth: 220 }}>
            {editingId ? cp("O‘zgarishlarni saqlash") : cp("Buyurtma berish")}
          </Button>
          {editingId ? <Button size="large" style={{ borderRadius: 18, height: 52, fontWeight: 700 }} onClick={resetForm}>Bekor qilish</Button> : null}
        </div>
      </Space>
    </Card>
  );
}