import React from "react";
import { ConfigProvider } from "antd";
import { useNavigate } from "react-router-dom";
import ClientDashboard from "@/modules/client/features/client/components/ClientDashboard.jsx";
import { usePageI18n } from "./pageI18n";
import { useDashboardController } from "./dashboard.logic.js";
import { DashboardDrawer, DashboardHeader } from "./dashboard.sections.jsx";

export default function Dashboard() {
  const navigate = useNavigate();
  const { t, tx, setLanguage } = usePageI18n();
  const {
    open,
    setOpen,
    setCurrentView,
    toggleDrawer,
    menuItems,
    langMenu,
  } = useDashboardController({ navigate, t, tx, setLanguage });

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#FFD700",
          borderRadius: 14,
          fontFamily: "AccentHeadline, Inter, system-ui, sans-serif",
        },
      }}
    >
      <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
        <DashboardHeader
          appName={t.appName}
          langMenu={langMenu}
          onMenuClick={toggleDrawer}
        />

        <DashboardDrawer
          title={t.menu || tx("menu", "Menyu")}
          subtitle={t.chooseSection || tx("chooseSection", "Bo‘limni tanlang")}
          open={open}
          onClose={toggleDrawer}
          menuItems={menuItems}
          onSelect={(item) => {
            setOpen(false);
            if (item.onClick) item.onClick();
            else setCurrentView(item.key);
          }}
        />

        <div style={{ padding: 16 }}>
          <ClientDashboard />
        </div>
      </div>
    </ConfigProvider>
  );
}
