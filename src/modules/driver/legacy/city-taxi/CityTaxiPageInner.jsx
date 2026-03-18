/**
 * CityTaxiPageInner
 */
import React from "react";
import { Button, Drawer } from "antd";
import { AimOutlined, EnvironmentOutlined } from "@ant-design/icons";

import { useDriverTaxiController } from "./hooks/useDriverTaxiController";

import TaxiMap from "./components/map/TaxiMap";
import TopStatusPanel from "./components/panels/TopStatusPanel";
import BottomActionPanel from "./components/panels/BottomActionPanel";
import IncomingOrderModal from "./components/modals/IncomingOrderModal";
import OrderInfoCard from "./components/widgets/OrderInfoCard";
import Taximeter from "./components/widgets/Taximeter";
import DailyMissions from "./components/widgets/DailyMissions";
import DriverConnectionBadge from "./components/widgets/DriverConnectionBadge";
import DriverDaySnapshot from "./components/widgets/DriverDaySnapshot";

export default function CityTaxiPageInner() {
  const {
    state,
    dispatch,
    isOnline,
    activeOrder,
    incomingOrder,
    actions,
    earnings,
    detailsOpen,
    setDetailsOpen,
    missionsOpen,
    setMissionsOpen,
    userId,
    canShowLocate,
    heartbeatUpdatedAt,
    gpsAccuracy,
    bottomMode,
  } = useDriverTaxiController();

  return (
    <div style={{ position: "relative", height: "100vh", width: "100%" }}>
      <TaxiMap />

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
        userId={userId}
        onOpenMissions={() => setMissionsOpen(true)}
      />

      <BottomActionPanel
        mode={bottomMode}
        activeOrder={activeOrder}
        onStartTrip={actions.startTrip}
        onArrived={actions.arrived}
        onCompleteTrip={actions.completeTrip}
        onCancelOrder={actions.cancelOrder}
      />

      <IncomingOrderModal
        open={!!incomingOrder}
        order={incomingOrder}
        onAccept={() => actions.accept(incomingOrder?.id)}
        onDecline={() => actions.decline(incomingOrder?.id)}
      />

      {!!activeOrder && (
        <div style={{ position: "absolute", left: 12, right: 12, bottom: 86, zIndex: 901 }}>
          <OrderInfoCard order={activeOrder} onOpenDetails={() => setDetailsOpen(true)} />
          {bottomMode === "onTrip" ? <Taximeter order={activeOrder} /> : null}
        </div>
      )}

      <Drawer
        title="Safar tafsilotlari"
        placement="bottom"
        height={380}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      >
        {!!activeOrder ? (<><OrderInfoCard order={activeOrder} expanded /><DriverDaySnapshot earnings={earnings} activeOrder={activeOrder} /></>) : <div style={{ color: "#667085" }}>Faol buyurtma yo‘q</div>}
      </Drawer>

      <Drawer
        title="Kunlik missiyalar"
        placement="right"
        width={380}
        open={missionsOpen}
        onClose={() => setMissionsOpen(false)}
      >
        <DailyMissions userId={userId} />
      </Drawer>

      <div style={{ position: "absolute", left: 12, top: 88, zIndex: 900, display: "grid", gap: 8 }}>
        <DriverConnectionBadge updatedAt={heartbeatUpdatedAt} accuracy={gpsAccuracy} isOnline={isOnline} />
        {!!state.driverLocation?.accuracy ? (
          <div
            style={{
              background: "rgba(255,255,255,0.92)",
              borderRadius: 999,
              padding: "6px 10px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 8px 22px rgba(0,0,0,0.12)",
            }}
          >
            <EnvironmentOutlined />
            <span>GPS aniqligi: {Math.round(state.driverLocation.accuracy)} m</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
