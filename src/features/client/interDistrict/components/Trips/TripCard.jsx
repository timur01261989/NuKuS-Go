import React from "react";
import { Card, Typography, Button, Space, Divider, Avatar, Tag } from "antd";
import { UserOutlined, CarOutlined, CheckCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

export default function TripCard({ trip, onRequest }) {
  if (!trip) return null;

  // Haydovchi, mashina, vaqt va narx ma'lumotlarini bazadan (API'dan) olish
  const driverName = trip.driver?.full_name || trip.driver?.name || "Haydovchi";
  const carModel = trip.car?.model || "Noma'lum mashina";
  const carNumber = trip.car?.plate_number || trip.car?.number || "";
  const price = trip.price || trip.price_per_seat || 0;
  const departTime = trip.depart_time || trip.departureTime;
  const availableSeats = trip.available_seats || trip.seats_available || 4;

  // Qulayliklar (Haydovchi bazaga qanday kiritgan bo'lsa shunday)
  const hasAc = trip.features?.ac || trip.ac;
  const hasTrunk = trip.features?.trunk || trip.trunk;

  return (
    <Card
      bodyStyle={{ padding: "16px" }}
      style={{
        borderRadius: 16,
        marginBottom: 16,
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        border: "1px solid #f0f0f0",
      }}
    >
      {/* 1. Haydovchi va Mashina ma'lumotlari */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Space align="start">
          <Avatar size={48} icon={<UserOutlined />} src={trip.driver?.avatar_url} />
          <div>
            <Typography.Text strong style={{ display: "block", fontSize: 16 }}>
              {driverName}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 13, display: "block", marginTop: 2 }}>
              <CarOutlined style={{ marginRight: 4 }} />
              {carModel} {carNumber && `• ${carNumber}`}
            </Typography.Text>
          </div>
        </Space>
        
        {/* Narx qismi */}
        <div style={{ textAlign: "right" }}>
          <Typography.Text strong style={{ display: "block", fontSize: 18, color: "#1677ff" }}>
            {price.toLocaleString()} so'm
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            1 ta o'rindiq uchun
          </Typography.Text>
        </div>
      </div>

      <Divider style={{ margin: "12px 0" }} />

      {/* 2. Reys detallari */}
      <Space direction="vertical" style={{ width: "100%" }} size={8}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Typography.Text type="secondary">Jo'nash vaqti:</Typography.Text>
          <Typography.Text strong>
            {departTime ? dayjs(departTime).format("DD-MMM, HH:mm") : "Kelishilgan vaqtda"}
          </Typography.Text>
        </div>
        
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Typography.Text type="secondary">Bo'sh o'rindiqlar:</Typography.Text>
          <Typography.Text strong>{availableSeats} ta</Typography.Text>
        </div>

        {/* Qulayliklar teglarini chiqarish */}
        {(hasAc || hasTrunk) && (
          <div style={{ marginTop: 4 }}>
            {hasAc && <Tag color="blue">Konditsioner bor</Tag>}
            {hasTrunk && <Tag color="green">Katta yukxona</Tag>}
          </div>
        )}
        
        {/* Haydovchining izohi (agar kiritgan bo'lsa) */}
        {trip.note && (
          <div style={{ marginTop: 8, padding: 8, backgroundColor: "#f9f9f9", borderRadius: 8 }}>
            <Typography.Text type="secondary" italic>
              " {trip.note} "
            </Typography.Text>
          </div>
        )}
      </Space>

      {/* 3. Buyurtma jo'natish tugmasi */}
      <Button
        type="primary"
        style={{ width: "100%", marginTop: 16, height: 44, borderRadius: 12, fontWeight: "bold" }}
        onClick={() => onRequest(trip)}
        icon={<CheckCircleOutlined />}
      >
        Buyurtma jo'natish
      </Button>
    </Card>
  );
}