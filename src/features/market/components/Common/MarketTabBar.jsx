
import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { HomeOutlined, HeartOutlined, PlusCircleOutlined, UserOutlined, UnorderedListOutlined } from "@ant-design/icons";

const tabs = [
  { key: "home", label: "Market", path: "/market", icon: <HomeOutlined /> },
  { key: "fav", label: "Saqlangan", path: "/market/favorites", icon: <HeartOutlined /> },
  { key: "sell", label: "Sotish", path: "/market/create", icon: <PlusCircleOutlined /> },
  { key: "my", label: "E'lonlarim", path: "/market/my-ads", icon: <UnorderedListOutlined /> },
  { key: "profile", label: "Profil", path: "/market/profile", icon: <UserOutlined /> },
];

export default function MarketTabBar() {
  const loc = useLocation();
  const nav = useNavigate();

  const activeKey = useMemo(() => {
    const m = tabs.find((t) => loc.pathname === t.path || loc.pathname.startsWith(t.path + "/"));
    return m?.key || "home";
  }, [loc.pathname]);

  return (
    <div style={{
      position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 50,
      background: "white", borderTop: "1px solid #f0f0f0",
      display: "flex", justifyContent: "space-around",
      padding: "8px 6px"
    }}>
      {tabs.map((t) => {
        const active = t.key === activeKey;
        return (
          <button
            key={t.key}
            onClick={() => nav(t.path)}
            style={{
              border: "none", background: "transparent",
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 4, fontSize: 11,
              color: active ? "#1677ff" : "#777"
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>{t.icon}</span>
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
