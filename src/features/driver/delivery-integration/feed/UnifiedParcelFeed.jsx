import React, { useMemo, useState, useEffect } from "react";
import { Drawer, Spin, message } from "antd";
import DeliveryModeToggle from "../controls/DeliveryModeToggle";
import CapacitySelector from "../controls/CapacitySelector";
import RouteFilter from "../controls/RouteFilter";
import FeedHeader from "./FeedHeader";
import EmptyState from "./EmptyState";
import ParcelCardSmall from "../widgets/ParcelCardSmall";
import ParcelCardLarge from "../widgets/ParcelCardLarge";
import AcceptParcelModal from "../actions/AcceptParcelModal";
import QuickPickupFlow from "../actions/QuickPickupFlow";
import DropoffCodeInput from "../actions/DropoffCodeInput";
import { useDeliveryIntegration } from "../context/IntegrationContext";
import { useParcelSocket } from "../hooks/useParcelSocket";
import { useRouteMatching } from "../hooks/useRouteMatching";
import { acceptParcel } from "../services/integrationApi";

export default function UnifiedParcelFeed({
  supabase,
  driverLoc,
  driverId,
  driverMode = "CITY",
  routePoints,
  vehiclePlate,
  deepLinkBase = "myapp://parcel/",
  defaultOpen = false,
}) {
  const {
    state,
    setEnabled,
    setCapacity,
    setOnlyMyRoute,
    setDriverMode,
    setParcels,
    setFiltered,
    setRealtimeEvent,
  } = useDeliveryIntegration();

  const [drawerOpen, setDrawerOpen] = useState(defaultOpen);
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);

  useEffect(() => { setDriverMode(driverMode); }, [driverMode, setDriverMode]);

  useParcelSocket({
    enabled: state.enabled,
    supabase,
    filter: {},
    onSnapshot: (data) => setParcels(data),
    onEvent: (evt) => setRealtimeEvent(evt),
  });

  const matched = useRouteMatching({
    parcels: state.parcels,
    enabled: state.enabled,
    driverMode: state.driverMode,
    onlyMyRoute: state.onlyMyRoute,
    routePoints,
    driverLoc,
    radiusKm: state.radiusKm,
    capacity: state.capacity,
  });

  useEffect(() => { setFiltered(matched); }, [matched, setFiltered]);

  const tone = useMemo(() => {
    if (state.driverMode === "CITY") return "gold";
    if (state.driverMode === "INTERDISTRICT") return "blue";
    return "green";
  }, [state.driverMode]);

  const subtitle = useMemo(() => {
    if (state.driverMode === "CITY") return "Radius bo'yicha yaqin posilkalar";
    return state.onlyMyRoute ? "Faqat yo'lingizdagilar (deviation < 2km)" : "Barcha posilkalar";
  }, [state.driverMode, state.onlyMyRoute]);

  const openAccept = (p) => { setSelectedParcel(p); setAcceptOpen(true); };

  const doAccept = async ({ parcel, note }) => {
    if (!parcel?.id) return;
    try {
      setAcceptLoading(true);
      await acceptParcel({ parcelId: parcel.id, driverId, payload: { driver_note: note || null } });
      message.success("✅ Posilka qabul qilindi");
      setAcceptOpen(false);
      setQuickOpen(true);
    } catch (e) {
      message.error("Qabul qilishda xatolik: " + (e?.message || "unknown"));
    } finally {
      setAcceptLoading(false);
    }
  };

  const deepLink = selectedParcel?.id ? `${deepLinkBase}${selectedParcel.id}` : null;
  const drawerHeight = state.onTrip ? 280 : 520;

  return (
    <>
      <div style={{ position: "fixed", right: 14, bottom: state.onTrip ? 90 : 22, zIndex: 999 }}>
        <div
          onClick={() => setDrawerOpen(true)}
          style={{
            padding: "10px 12px",
            borderRadius: 999,
            background: state.enabled ? "rgba(250,173,20,.95)" : "rgba(255,255,255,.95)",
            border: "1px solid rgba(0,0,0,.08)",
            boxShadow: "0 12px 24px rgba(0,0,0,.12)",
            cursor: "pointer",
            fontWeight: 800,
          }}
        >
          📦 Pochta
        </div>
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} placement="bottom" height={drawerHeight} styles={{ body: { padding: 0 } }}>
        <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid rgba(0,0,0,.06)" }}>
          <DeliveryModeToggle enabled={state.enabled} onChange={setEnabled} />
          <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
            <CapacitySelector value={state.capacity} onChange={setCapacity} />
            {state.driverMode !== "CITY" ? <RouteFilter onlyMyRoute={state.onlyMyRoute} onChange={setOnlyMyRoute} /> : null}
          </div>
        </div>

        <FeedHeader
          title={state.driverMode === "CITY" ? "Shahar posilkalari" : "Trassa posilkalari"}
          subtitle={subtitle}
          count={state.filtered.length}
          tone={tone}
        />

        {!state.enabled ? (
          <EmptyState title="Pochta rejimi o'chirilgan" desc="Yoqib qo'ysangiz yo'lingizdagi posilkalar chiqadi." onRefresh={() => {}} />
        ) : state.loading ? (
          <div style={{ padding: 20 }}><Spin /></div>
        ) : state.filtered.length === 0 ? (
          <EmptyState onRefresh={() => {}} />
        ) : (
          <div style={{ paddingBottom: 18 }}>
            {state.filtered.map((p) =>
              state.driverMode === "CITY" ? (
                <ParcelCardSmall key={p.id} parcel={p} onAccept={openAccept} />
              ) : (
                <ParcelCardLarge key={p.id} parcel={p} onAccept={openAccept} />
              )
            )}
          </div>
        )}
      </Drawer>

      <AcceptParcelModal open={acceptOpen} parcel={selectedParcel} onCancel={() => setAcceptOpen(false)} onAccept={doAccept} loading={acceptLoading} />

      <QuickPickupFlow
        open={quickOpen}
        parcel={selectedParcel}
        vehiclePlate={vehiclePlate}
        deepLink={deepLink}
        onClose={() => setQuickOpen(false)}
        onDone={() => { setQuickOpen(false); setCodeOpen(true); }}
      />

      <DropoffCodeInput open={codeOpen} parcel={selectedParcel} onClose={() => setCodeOpen(false)} onCompleted={() => { setCodeOpen(false); setSelectedParcel(null); }} />
    </>
  );
}
