import React, { useEffect, useState } from "react";
import { Drawer, Button, List, Space, Tag, Typography, message, Divider, Tooltip } from "antd";
import { 
  InboxOutlined, 
  ReconciliationOutlined, 
  UserOutlined, 
  PhoneOutlined, 
  EnvironmentOutlined, 
  CopyOutlined,
  SafetyCertificateOutlined,
  ArrowRightOutlined
} from "@ant-design/icons";
import { listDriverRequests, respondTripRequest } from "@/features/shared/interDistrictTrips";

/**
 * TripRequestsDrawer.jsx (Driver)
 * -------------------------------------------------------
 * Haydovchiga kelgan so‘rovlar ro'yxati.
 * - Eltish, Yuk va Oddiy yo'lovchi so'rovlarini ajratib ko'rsatadi
 * - Ayollar rejimi (female_only) bo'yicha indikatorlar
 * - Mijoz ma'lumotlarini nusxalash imkoniyati
 */

const { Text, Title } = Typography;
const money = (n) => (n == null ? "" : new Intl.NumberFormat("uz-UZ").format(Number(n)));

export default function TripRequestsDrawer({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  // So'rovlarni yuklash funksiyasi
  const load = async () => {
    setLoading(true);
    try {
      const list = await listDriverRequests({ limit: 100 });
      setItems(list || []);
    } catch (e) {
      console.error("So'rovlarni yuklashda xato:", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  // So'rovga javob berish (Qabul/Rad)
  const respond = async (requestId, status) => {
    try {
      await respondTripRequest(requestId, status);
      message.success(status === "accepted" ? "So'rov qabul qilindi" : "So'rov rad etildi");
      load(); // Ro'yxatni yangilash
    } catch (e) {
      message.error("Amalni bajarishda xato");
    }
  };

  // Telefon raqamni nusxalash
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    message.success("Nusxalandi");
  };

  return (
    <Drawer
      title={
        <Space>
          <Title level={4} style={{ margin: 0 }}>Kelgan so'rovlar</Title>
          <Tag color="blue">{items.length} ta</Tag>
        </Space>
      }
      placement="right"
      width={window.innerWidth > 500 ? 450 : "95%"}
      onClose={onClose}
      open={open}
      extra={
        <Button onClick={load} loading={loading} type="text" icon={<InboxOutlined />}>
          Yangilash
        </Button>
      }
    >
      <List
        loading={loading}
        dataSource={items}
        locale={{ emptyText: "Hozircha yangi so'rovlar yo'q" }}
        renderItem={(r) => (
          <List.Item style={{ padding: 0, border: "none" }}>
            <div 
              style={{
                width: "100%",
                marginBottom: 16,
                padding: 16,
                borderRadius: 16,
                background: r.is_female ? "rgba(235, 47, 150, 0.03)" : "#f9f9f9",
                border: r.is_female ? "1px solid #ffadd2" : "1px solid #f0f0f0",
                boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
              }}
            >
              <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
                <div style={{ flex: 1 }}>
                  {/* Mijoz Asosiy Ma'lumotlari */}
                  <div style={{ marginBottom: 12 }}>
                    <Space size={12}>
                      <div style={{ 
                        width: 44, height: 44, borderRadius: 22, 
                        background: r.is_female ? "#eb2f96" : "#1677ff",
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                        <UserOutlined style={{ color: "#fff", fontSize: 20 }} />
                      </div>
                      <div>
                        <Title level={5} style={{ margin: 0 }}>{r.client_name || "Mijoz"}</Title>
                        <Space size={4} onClick={() => copyToClipboard(r.client_phone)} style={{ cursor: "pointer" }}>
                          <PhoneOutlined style={{ color: "#8c8c8c" }} />
                          <Text type="secondary">{r.client_phone}</Text>
                          <CopyOutlined style={{ fontSize: 12, color: "#bfbfbf" }} />
                        </Space>
                      </div>
                    </Space>
                  </div>

                  {/* Yo'nalish va Manzil */}
                  <div style={{ background: "#fff", padding: "8px 12px", borderRadius: 10, marginBottom: 12 }}>
                    <Space direction="vertical" size={4} style={{ width: "100%" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <EnvironmentOutlined style={{ color: "#52c41a" }} />
                        <Text strong>{r.pickup_address || "Manzildan olish"}</Text>
                      </div>
                      <ArrowRightOutlined style={{ fontSize: 10, marginLeft: 3, opacity: 0.5 }} />
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <EnvironmentOutlined style={{ color: "#ff4d4f" }} />
                        <Text type="secondary">{r.dropoff_address || "Manzilga eltish"}</Text>
                      </div>
                    </Space>
                  </div>

                  {/* Xizmat Turlari (Tags) */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {r.is_eltish && (
                      <Tag icon={<InboxOutlined />} color="blue" style={{ borderRadius: 6 }}>
                        Eltish (Pochta)
                      </Tag>
                    )}
                    {r.is_yuk && (
                      <Tag icon={<ReconciliationOutlined />} color="orange" style={{ borderRadius: 6 }}>
                        Yuk olaman
                      </Tag>
                    )}
                    {!r.is_eltish && !r.is_yuk && (
                      <Tag icon={<UserOutlined />} color="green" style={{ borderRadius: 6 }}>
                        {r.seats_count || 1} yo'lovchi
                      </Tag>
                    )}
                    {r.is_female && (
                      <Tag icon={<SafetyCertificateOutlined />} color="magenta" style={{ borderRadius: 6 }}>
                        Ayol kishi
                      </Tag>
                    )}
                  </div>

                  {/* Narx Taklifi */}
                  {r.price_offer && (
                    <div style={{ marginTop: 12, background: "rgba(22, 119, 255, 0.05)", padding: "8px 12px", borderRadius: 10 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>Mijoz taklifi:</Text>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#1677ff" }}>
                        {money(r.price_offer)} <span style={{ fontSize: 12 }}>so'm</span>
                      </div>
                    </div>
                  )}

                  {/* Izoh */}
                  {r.notes && (
                    <div style={{ marginTop: 10 }}>
                      <Text type="secondary" italic style={{ fontSize: 13 }}>
                        " {r.notes} "
                      </Text>
                    </div>
                  )}
                </div>

                {/* Boshqaruv Tugmalari */}
                {r.status === "pending" && (
                  <Space direction="vertical" style={{ marginLeft: 12 }}>
                    <Tooltip title="Qabul qilish">
                      <Button 
                        type="primary" 
                        shape="round"
                        icon={<CheckCircleFilled />}
                        onClick={() => respond(r.id, "accepted")}
                        style={{ height: 45, width: 85, fontSize: 13 }}
                      >
                        Qabul
                      </Button>
                    </Tooltip>
                    <Tooltip title="Rad etish">
                      <Button 
                        danger 
                        shape="round"
                        onClick={() => respond(r.id, "rejected")}
                        style={{ height: 45, width: 85, fontSize: 13 }}
                      >
                        Rad
                      </Button>
                    </Tooltip>
                  </Space>
                )}
              </Space>
            </div>
          </List.Item>
        )}
      />
    </Drawer>
  );
}

// Icons import fix (missing in original snippet but needed)
import { CheckCircleFilled } from "@ant-design/icons";