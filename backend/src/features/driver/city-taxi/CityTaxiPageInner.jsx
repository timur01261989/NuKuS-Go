import React, { useEffect, useMemo, useState } from "react";
import { Button, Drawer, message } from "antd";
import { AimOutlined, EnvironmentOutlined } from "@ant-design/icons";

import { useTaxi } from "./context/TaxiProvider";
import { useTaxiSocket } from "./hooks/useTaxiSocket";
import { useDriverLocation } from "./hooks/useDriverLocation";
import { useOrderActions } from "./hooks/useOrderActions";
import { useEarnings } from "./hooks/useEarnings";

import TaxiMap from "./components/map/TaxiMap";
import TopStatusPanel from "./components/panels/TopStatusPanel";
import BottomActionPanel from "./components/panels/BottomActionPanel";
import IncomingOrderModal from "./components/modals/IncomingOrderModal";
import OrderInfoCard from "./components/widgets/OrderInfoCard";
import Taximeter from "./components/widgets/Taximeter";

/**
 * CityTaxiPageInner
 * - Xarita + panellar + modal + logikalar bir joyda
 */
export default function CityTaxiPageInner() {
  const { state, dispatch } = useTaxi();
  const { isOnline, activeOrder, incomingOrder, ui } = state;

  const actions = useOrderActions();
  const { earnings } = useEarnings();

  // realtime / polling
  useTaxiSocket({ enabled: isOnline });

  // GPS tracking + serverga yuborish
  useDriverLocation({ enabled: isOnline });

  const [detailsOpen, setDetailsOpen] = useState(false);

  const canShowLocate = !!state.driverLocation?.latlng;

  const bottomMode = useMemo(() => {
    if (activeOrder?.status === "ON_TRIP") return "onTrip";
    if (activeOrder?.status === "ACCEPTED") return "goingToClient";
    if (activeOrder?.status === "ARRIVED") return "arrived";
    if (activeOrder?.status === "COMPLETED") return "completed";
    return "idle";
  }, [activeOrder?.status]);

  useEffect(() => {
    if (ui.toast) {
      message.info(ui.toast);
      dispatch({ type: "ui/clearToast" });
    }
  }, [ui.toast, dispatch]);

  return (
    <div style={{ position: "relative", height: "100vh", width: "100%" }}>
      <TaxiMap />

      {/* 🎯 Locate me button */}
      <div style={{ position: "absolute", right: 14, top: 88, zIndex: 900 }}>
        <Button
          shape="circle"
          size="large"
          icon={<AimOutlined />}
          disabled={!canShowLocate}
          onClick={() => dispatch({ type: "map/flyToDriver" })}
          style={{ boxShadow: "0 8px 22px rgba(0,0,0,0.18)" }}
        />
      </div>

      <TopStatusPanel
        isOnline={isOnline}
        onToggleOnline={actions.toggleOnline}
        earnings={earnings}
        onOpenDetails={() => setDetailsOpen(true)}
      />

      <BottomActionPanel
        mode={bottomMode}
        activeOrder={activeOrder}
        onStartTrip={actions.startTrip}
        onArrived={actions.arrived}
        onComplete={actions.completeTrip}
        onCancel={actions.cancelOrder}
        onOpenDetails={() => setDetailsOpen(true)}
      />

      <IncomingOrderModal
        order={incomingOrder}
        visible={!!incomingOrder}
        onAccept={() => incomingOrder && actions.accept(incomingOrder.id)}
        onDecline={() => incomingOrder && actions.decline(incomingOrder.id)}
      />

      {/* Widgets */}
      {activeOrder && (
        <div style={{ position: "absolute", left: 12, right: 12, bottom: 120, zIndex: 850 }}>
          <OrderInfoCard order={activeOrder} />
          <div style={{ height: 10 }} />
          <Taximeter order={activeOrder} />
        </div>
      )}

      <Drawer
        title="Buyurtma tafsilotlari"
        placement="bottom"
        height="65vh"
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        bodyStyle={{ paddingBottom: 40 }}
      >
        {!activeOrder ? (
          <div style={{ opacity: 0.75 }}>Hozir aktiv buyurtma yo‘q.</div>
        ) : (
          <>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 10 }}>
              #{String(activeOrder.id).slice(-6)} • {activeOrder.status}
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <EnvironmentOutlined />
                <div>
                  <div style={{ fontWeight: 700 }}>Olish nuqtasi</div>
                  <div style={{ opacity: 0.85 }}>{activeOrder.pickup_address || "-"}</div>
                </div>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <EnvironmentOutlined />
                <div>
                  <div style={{ fontWeight: 700 }}>Yakuniy manzil</div>
                  <div style={{ opacity: 0.85 }}>{activeOrder.dropoff_address || "-"}</div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button danger onClick={actions.cancelOrder}>
                Buyurtmani bekor qilish
              </Button>
              <Button onClick={() => message.info("Chat keyin qo‘shiladi")}>Chat</Button>
              <Button type="primary" onClick={() => setDetailsOpen(false)}>
                Yopish
              </Button>
            </div>
          </>
        )}
      </Drawer>

      <style>{`
        .citytaxi-map-wrap { position:absolute; inset:0; }
      `}</style>
    </div>
  );
}
