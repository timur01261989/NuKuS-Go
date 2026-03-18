import React from "react";
import { Button, Typography, Row, Col, Drawer, Tag, Badge } from "antd";
import {
  NotificationOutlined,
  UserOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import DriverProfile from "./DriverProfile";

const { Title } = Typography;

export function StarFilledIcon() {
  return <span style={{ color: "#faad14", fontSize: 18 }}>★</span>;
}

export function ServiceCard({ title, subtitle, icon, onClick, color = "#fff", horizontal = false }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: color,
        borderRadius: 20,
        padding: horizontal ? "18px 22px" : "22px 18px",
        minHeight: horizontal ? 96 : 140,
        cursor: "pointer",
        display: "flex",
        flexDirection: horizontal ? "row" : "column",
        alignItems: horizontal ? "center" : "flex-start",
        justifyContent: "space-between",
        gap: 12,
        boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
      }}
    >
      <div>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: 16 }}>{title}</div>
        <div style={{ color: "#666", fontSize: 12 }}>{subtitle}</div>
      </div>
    </div>
  );
}

export function DriverOrderFeedHeader({ isOnline, toggleDarkMode, onOpenProfile }) {
  return (
    <div style={{ padding: "15px 20px", background: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#111", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 18 }}>N</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>Nukus-Go</div>
          <div style={{ fontSize: 11, color: isOnline ? "#52c41a" : "#999", fontWeight: 600 }}>
            {isOnline ? "● Ishdasiz" : "○ Ish vaqti emas"}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <Button shape="circle" icon={<span style={{ fontSize: 16 }}>🌙</span>} onClick={toggleDarkMode} />
        <Badge count={1} dot>
          <Button shape="circle" icon={<UserOutlined />} onClick={onOpenProfile} />
        </Badge>
      </div>
    </div>
  );
}

export function DriverOrderFeedStats({ stats }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ background: "linear-gradient(135deg, #1f1f1f 0%, #3a3a3a 100%)", borderRadius: 24, padding: "20px", color: "white", boxShadow: "0 10px 30px rgba(0,0,0,0.25)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, background: "rgba(255,255,255,0.05)", borderRadius: "50%" }} />
        <Row gutter={16} align="middle">
          <Col span={14}>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 5 }}>Bugungi daromad</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#73d13d", letterSpacing: 0.5 }}>
              {stats.todayEarnings.toLocaleString()} <span style={{ fontSize: 14, color: "#fff" }}>so'm</span>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <Tag color="transparent" style={{ border: "1px solid rgba(255,255,255,0.3)", color: "white", borderRadius: 20 }}>
                {stats.ordersCount} ta buyurtma
              </Tag>
            </div>
          </Col>
          <Col span={10} style={{ textAlign: "right", borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                <StarFilledIcon />
                <span style={{ fontSize: 20, fontWeight: 800 }}>{stats.rating}</span>
              </div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Reyting</div>
              <div style={{ marginTop: 8, fontSize: 12, color: stats.activity > 90 ? "#73d13d" : "#faad14" }}>
                Faollik: {stats.activity}%
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
}

export function DriverOrderFeedNotice() {
  return (
    <div style={{ marginBottom: 25 }}>
      <div style={{ background: "#fffbe6", border: "1px solid #ffe58f", borderRadius: 16, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <NotificationOutlined style={{ color: "#faad14", fontSize: 20 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#555" }}>Bonuslar vaqti!</div>
          <div style={{ fontSize: 11, color: "#888" }}>Bugun soat 18:00 dan 21:00 gacha +20% bonus.</div>
        </div>
      </div>
    </div>
  );
}

export function DriverOrderFeedProfileDrawer({
  profileOpen, setProfileOpen, drawerInnerRef, onProfileTouchStart, onProfileTouchMove, onProfileTouchEnd, isOnline, loading, toggleOnline, onLogout
}) {
  return (
    <Drawer placement="right" width="85%" closable={false} onClose={() => setProfileOpen(false)} open={profileOpen} styles={{ body: { padding: 0 } }} maskClosable>
      <div ref={drawerInnerRef} style={{ height: "100%", background: "#fff", display: "flex", flexDirection: "column" }} onTouchStart={onProfileTouchStart} onTouchMove={onProfileTouchMove} onTouchEnd={onProfileTouchEnd}>
        <div style={{ padding: "40px 20px 20px", background: "#111", color: "white" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#fff", color: "#111", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, marginBottom: 15 }}>N</div>
          <div style={{ fontSize: 24, fontWeight: 800 }}>Haydovchi paneli</div>
          <div style={{ color: "rgba(255,255,255,0.7)" }}>Profil va tezkor sozlamalar</div>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 700 }}>Onlayn holat</div>
              <div style={{ color: "#888", fontSize: 12 }}>Buyurtma qabul qilish holati</div>
            </div>
          </div>
          <DriverProfile isOnline={isOnline} loading={loading} onToggleOnline={toggleOnline} onLogout={onLogout} />
        </div>
      </div>
    </Drawer>
  );
}

export function DriverOrderFeedServices({ setSelectedService, CarOutlined, GlobalOutlined, ShopOutlined, RocketOutlined }) {
  return (
    <>
      <Title level={4} style={{ marginBottom: 15, paddingLeft: 5 }}>Xizmat turini tanlang</Title>
      <Row gutter={[15, 15]}>
        <Col span={12}>
          <ServiceCard title="Shahar ichida" subtitle="Taksi" icon={<CarOutlined style={{ fontSize: 32, color: "#1890ff" }} />} onClick={() => setSelectedService("taxi")} color="#e6f7ff" />
        </Col>
        <Col span={12}>
          <ServiceCard title="Tumanlar aro" subtitle="Qatnov" icon={<EnvironmentOutlined style={{ fontSize: 32, color: "#52c41a" }} />} onClick={() => setSelectedService("inter_district")} color="#f6ffed" />
        </Col>
        <Col span={24}>
          <ServiceCard title="Viloyatlar aro" subtitle="Uzoq masofa" icon={<GlobalOutlined style={{ fontSize: 32, color: "#722ed1" }} />} onClick={() => setSelectedService("inter_provincial")} horizontal color="#f9f0ff" />
        </Col>
        <Col span={12}>
          <ServiceCard title="Yuk tashish" subtitle="Truck" icon={<ShopOutlined style={{ fontSize: 32, color: "#fa8c16" }} />} onClick={() => setSelectedService("freight")} color="#fff7e6" />
        </Col>
        <Col span={12}>
          <ServiceCard title="Pochta / Eltish" subtitle="Delivery" icon={<RocketOutlined style={{ fontSize: 32, color: "#eb2f96" }} />} onClick={() => setSelectedService("delivery")} color="#fff0f6" />
        </Col>
      </Row>
    </>
  );
}
