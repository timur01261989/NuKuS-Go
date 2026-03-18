import React from "react";
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  Popconfirm,
  Tag,
  Typography,
} from "antd";
import {
  DeleteOutlined,
  EnvironmentOutlined,
  SearchOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { BRAND } from "./myAddresses.helpers.jsx";
import { searchAssets } from "@/assets/search";
import { profileAssets } from "@/assets/profile";
import { assetStyles } from "@/assets/assetPolish";

const { Title, Text, Paragraph } = Typography;

export function MyAddressesHeader({ t }) {
  return (
    <header style={{ marginBottom: 35 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}><img src={profileAssets.avatar} alt="" style={assetStyles.profileAvatar} /><Title level={2} style={{ fontWeight: 900, textTransform: "uppercase", letterSpacing: 1, margin: 0 }}>
        {t?.myAddressesTitle || "Mening manzillarim"}
      </Title></div>
      <Text type="secondary" style={{ fontSize: 14 }}>
        TEZ-TEZ TASHRIF BUYURADIGAN MANZILLARINGIZNI BOSHQARING
      </Text>
    </header>
  );
}

export function AddressFormCard({ form, onFinish, onOpenMap }) {
  return (
    <Card
      style={{
        borderRadius: 25,
        background: BRAND.blue,
        border: "none",
        marginBottom: 40,
        boxShadow: "0 12px 40px rgba(0,87,183,0.2)",
      }}
      bodyStyle={{ padding: 35 }}
    >
      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
        <Form.Item name="latitude" noStyle><Input type="hidden" /></Form.Item>
        <Form.Item name="longitude" noStyle><Input type="hidden" /></Form.Item>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 25 }}>
          <Form.Item
            name="label"
            label={<Text strong style={{ color: BRAND.light, fontSize: 13 }}>MANZIL NOMI</Text>}
            rules={[{ required: true, message: "Nomini kiriting" }]}
          >
            <Input placeholder="Uy / Ish / Maktab" size="large" style={{ borderRadius: 12, height: 50, border: "none" }} />
          </Form.Item>

          <Form.Item
            name="address"
            label={<Text strong style={{ color: BRAND.light, fontSize: 13 }}>TO'LIQ MANZIL</Text>}
            rules={[{ required: true, message: "Manzilni belgilang" }]}
          >
            <Input
              prefix={<img src={searchAssets.magnifier} alt="" style={assetStyles.searchMarkerIcon} />}
              placeholder="Xaritadan belgilash uchun bosing..."
              size="large"
              readOnly
              onClick={onOpenMap}
              style={{ borderRadius: 12, height: 50, border: "none", cursor: "pointer" }}
            />
          </Form.Item>
        </div>

        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          icon={<SendOutlined />}
          style={{
            marginTop: 25,
            height: 55,
            borderRadius: 15,
            background: BRAND.light,
            color: BRAND.blue,
            fontWeight: 800,
            border: "none",
            fontSize: 16,
          }}
        >
          SAQLASH
        </Button>
      </Form>
    </Card>
  );
}

export function AddressItem({ item, onRemove }) {
  return (
    <Card
      hoverable
      style={{ borderRadius: 20, border: "1px solid #e5e7eb" }}
      bodyStyle={{ padding: 20 }}
      actions={[
        <Popconfirm
          key="delete"
          title="Manzilni o'chirishni tasdiqlaysizmi?"
          onConfirm={() => onRemove(item.id)}
          okText="Ha"
          cancelText="Yo'q"
        >
          <Button type="text" danger icon={<DeleteOutlined />}>O'chirish</Button>
        </Popconfirm>,
      ]}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 14, background: "#e6f4ff",
          display: "flex", alignItems: "center", justifyContent: "center", color: BRAND.blue,
        }}>
          {item.label?.toLowerCase().includes("uy") ? <img src={searchAssets.home} alt='' style={assetStyles.searchMarkerIcon} /> : item.label?.toLowerCase().includes("ish") ? <img src={searchAssets.work} alt='' style={assetStyles.searchMarkerIcon} /> : <img src={searchAssets.bookmark} alt='' style={assetStyles.searchMarkerIcon} />}
        </div>
        <div style={{ flex: 1 }}>
          <Title level={5} style={{ margin: 0 }}>{item.label}</Title>
          <Paragraph style={{ marginTop: 8, marginBottom: 10 }} type="secondary">
            {item.address}
          </Paragraph>
          <Tag color="blue">{Number(item.latitude || 0).toFixed(5)}, {Number(item.longitude || 0).toFixed(5)}</Tag>
        </div>
      </div>
    </Card>
  );
}

export function AddressesGrid({ items, onRemove }) {
  if (!items.length) {
    return (
      <div style={{ textAlign: "center", marginTop: 50 }}>
        <Empty description="Sizda hali saqlangan manzillar yo'q" />
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: 20,
        marginTop: 20,
      }}
    >
      {items.map((item) => (
        <AddressItem key={item.id} item={item} onRemove={onRemove} />
      ))}
    </div>
  );
}

export function MyAddressesFooter() {
  return (
    <footer style={{ marginTop: 60, textAlign: "center", opacity: 0.5 }}>
      <Text style={{ fontSize: 12 }}>UniGo v1.0.8 • Yagona Yechim • Nukus, 2026</Text>
    </footer>
  );
}
