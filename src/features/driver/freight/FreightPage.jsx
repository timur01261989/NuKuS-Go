import React, { useMemo, useState } from "react";
import { Button, Card, Col, Row, Tag, message, Spin } from "antd";
import { CheckCircleOutlined, ThunderboltOutlined, CameraOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { FreightProvider, useFreight } from "./context/FreightContext";
import VehiclePassport from "./components/shared/VehiclePassport";
import PhotoGallery from "./components/shared/PhotoGallery";
import UnifiedOrdersFeed from "./components/shared/UnifiedOrdersFeed";

import RouteBidBoard from "./components/modes/long-haul/RouteBidBoard";
import TruckLoadVisual from "./components/modes/long-haul/TruckLoadVisual";
import ReturnTripSetup from "./components/modes/long-haul/ReturnTripSetup";

import HourlyRateSetup from "./components/modes/city-logistics/HourlyRateSetup";
import MoverOption from "./components/modes/city-logistics/MoverOption";
import QuickOrderMap from "./components/modes/city-logistics/QuickOrderMap";

import MaterialSelector from "./components/modes/bulk-materials/MaterialSelector";
import VolumePriceInput from "./components/modes/bulk-materials/VolumePriceInput";
import QuarryLocator from "./components/modes/bulk-materials/QuarryLocator";

import HeavyLoadAlert from "./components/modals/HeavyLoadAlert";
import WeighStationInfo from "./components/modals/WeighStationInfo";

import { useFreightSocket } from "./hooks/useFreightSocket";
import { useTruckFilter } from "./hooks/useTruckFilter";
import { useMaterialCalculator } from "./hooks/useMaterialCalculator";
import { bidOnOrder } from "./services/freightApi";

const VEHICLES = [
  { id: "labo", title: "Labo / Damas", kind: "small", capacityTons: 0.6, bodyMeters: 1.6, image: "🛻", tent: false, openBody: false },
  { id: "gazel", title: "Gazel / Porter", kind: "medium", capacityTons: 1.5, bodyMeters: 3.0, image: "🚚", tent: true, openBody: false },
  { id: "isuzu", title: "Isuzu", kind: "medium", capacityTons: 3.5, bodyMeters: 4.2, image: "🚛", tent: true, openBody: false },
  { id: "fura", title: "Fura (Katta yuk)", kind: "heavy", capacityTons: 20, bodyMeters: 12, image: "🚛", tent: true, openBody: false },
  { id: "kamaz", title: "Kamaz / Samosval", kind: "bulk", capacityTons: 10, bodyMeters: 6, image: "🚜", tent: false, openBody: true },
];

function FreightInner() {
  const { state, dispatch } = useFreight();
  const [heavyOpen, setHeavyOpen] = useState(false);
  const [weighOpen, setWeighOpen] = useState(false);

  // load orders realtime/polling when active
  const enabled = state.step === 3;
  useFreightSocket({ enabled, dispatch, vehicle: state.vehicle, mode: state.mode });

  const filtered = useTruckFilter(state.orders, state.vehicle, state.mode);
  const bulkTotal = useMaterialCalculator(state.volume, state.bulkPrice);

  const modeLabel = useMemo(() => {
    if (state.mode === "long-haul") return "Uzoq yo'l";
    if (state.mode === "city-logistics") return "Shahar ichi";
    if (state.mode === "bulk-materials") return "Qurilish material";
    return "";
  }, [state.mode]);

  const canProceedMode = !!state.vehicle;
  const canProceedActive = !!state.mode;

  const chooseVehicle = (v) => {
    dispatch({ type: "SET_VEHICLE", vehicle: v });
    // auto mode suggestion
    if (v.kind === "bulk") dispatch({ type: "SET_MODE", mode: "bulk-materials" });
    else if (v.kind === "small") dispatch({ type: "SET_MODE", mode: "city-logistics" });
    else dispatch({ type: "SET_MODE", mode: "long-haul" });
  };

  const bid = async (order) => {
    try {
      const hide = message.loading("Taklif yuborilmoqda...", 0);
      await bidOnOrder({ order_id: order.id, price: order.budget || null });
      hide();
      message.success("Taklif yuborildi");
    } catch (e) {
      message.error(e?.message || "Taklif yuborilmadi");
    }
  };

  return (
    <div style={{ padding: 14, maxWidth: 980, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900 }}>Freight (Haydovchi)</div>
          <div style={{ fontSize: 12, color: "#666" }}>Mashina → Rejim → Aktiv feed</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {state.mode ? <Tag color="gold" style={{ margin: 0 }}>{modeLabel}</Tag> : null}
          {state.vehicle ? <Tag color="blue" style={{ margin: 0 }}>{state.vehicle.title}</Tag> : null}
        </div>
      </div>

      {/* STEP INDICATOR */}
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        {[1,2,3].map((s) => (
          <div key={s} style={{
            flex: 1,
            borderRadius: 14,
            padding: 10,
            background: state.step === s ? "#111" : "#f5f5f5",
            color: state.step === s ? "#fff" : "#333",
            fontWeight: 800,
            textAlign: "center"
          }}>
            {s === 1 ? "1) Mashina" : s === 2 ? "2) Rejim" : "3) Aktiv"}
          </div>
        ))}
      </div>

      {state.step === 1 ? (
        <Card style={{ borderRadius: 18 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Siz nima haydaysiz?</div>
          <Row gutter={[12, 12]}>
            {VEHICLES.map((v) => (
              <Col xs={24} sm={12} md={8} key={v.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => chooseVehicle(v)}
                  onKeyDown={(e) => e.key === "Enter" && chooseVehicle(v)}
                  style={{
                    borderRadius: 18,
                    border: state.vehicle?.id === v.id ? "2px solid #52c41a" : "1px solid #eee",
                    padding: 14,
                    cursor: "pointer",
                    background: state.vehicle?.id === v.id ? "#f6ffed" : "#fff",
                    boxShadow: "0 10px 24px rgba(0,0,0,.06)",
                  }}
                >
                  <div style={{ fontSize: 34 }}>{v.image}</div>
                  <div style={{ fontWeight: 900, marginTop: 6 }}>{v.title}</div>
                  <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                    {v.capacityTons}t • {v.bodyMeters}m
                  </div>
                </div>
              </Col>
            ))}
          </Row>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              disabled={!canProceedMode}
              onClick={() => dispatch({ type: "GO_STEP", step: 2 })}
            >
              Davom etish
            </Button>
          </div>
        </Card>
      ) : null}

      {state.step === 2 ? (
        <div style={{ display: "grid", gap: 12 }}>
          <VehiclePassport vehicle={state.vehicle} />
          <PhotoGallery photos={state.photos} onChange={(photos) => dispatch({ type: "SET_PHOTOS", photos })} />

          {/* MODE CONFIG */}
          {state.mode === "long-haul" ? (
            <>
              <RouteBidBoard
                route={state.route}
                onRouteChange={(route) => dispatch({ type: "SET_ROUTE", route })}
                orders={filtered}
                onBid={bid}
              />
              <TruckLoadVisual fillPct={state.loadFillPct} onChange={(pct) => dispatch({ type: "SET_LOAD_FILL", pct })} />
              <ReturnTripSetup enabled={state.route.returnTrip} onChange={(v) => dispatch({ type: "SET_RETURN_TRIP", value: v })} />
            </>
          ) : null}

          {state.mode === "city-logistics" ? (
            <>
              <HourlyRateSetup pricing={state.pricing} onChange={(pricing) => dispatch({ type: "SET_CITY_PRICING", pricing })} />
              <MoverOption movers={state.movers} onChange={(movers) => dispatch({ type: "SET_MOVERS", movers })} />
              <QuickOrderMap orders={filtered} />
            </>
          ) : null}

          {state.mode === "bulk-materials" ? (
            <>
              <MaterialSelector material={state.material} onChange={(material) => dispatch({ type: "SET_MATERIAL", material })} />
              <VolumePriceInput
                volume={state.volume}
                bulkPrice={state.bulkPrice}
                onVolumeChange={(volume) => dispatch({ type: "SET_VOLUME", volume })}
                onPriceChange={(bulkPrice) => dispatch({ type: "SET_BULK_PRICE", bulkPrice })}
              />
              <QuarryLocator quarry={state.quarry} onChange={(q) => dispatch({ type: "SET_QUARRY", quarry: q })} />
              <Card size="small" style={{ borderRadius: 16 }}>
                <div style={{ fontWeight: 900, marginBottom: 6 }}>Hisob (demo)</div>
                <div style={{ fontSize: 13, color: "#333" }}>
                  Jami: <b>{bulkTotal.toLocaleString("ru-RU")} so‘m</b>
                </div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
                  (Material + hajm + narx asosida)
                </div>
              </Card>
            </>
          ) : null}

          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <Button onClick={() => dispatch({ type: "GO_STEP", step: 1 })}>Orqaga</Button>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              disabled={!canProceedActive}
              onClick={() => dispatch({ type: "GO_STEP", step: 3 })}
            >
              Aktiv bo‘lish
            </Button>
          </div>
        </div>
      ) : null}

      {state.step === 3 ? (
        <div style={{ display: "grid", gap: 12 }}>
          <Card style={{ borderRadius: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 16 }}>Aktiv feed</div>
                <div style={{ fontSize: 12, color: "#666" }}>
                  Sizning mashinangizga mos buyurtmalar ko‘rsatiladi
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Button icon={<CameraOutlined />} onClick={() => message.info("Tez rasm olish: keyingi bosqichda (kamera)")} />
                <Button icon={<InfoCircleOutlined />} onClick={() => setWeighOpen(true)} />
              </div>
            </div>
          </Card>

          {state.loadingOrders ? (
            <Card style={{ borderRadius: 18, textAlign: "center", padding: 24 }}>
              <Spin />
              <div style={{ marginTop: 8, color: "#666" }}>Yuklar yuklanmoqda...</div>
            </Card>
          ) : (
            <UnifiedOrdersFeed
              orders={filtered}
              onBid={(o) => {
                if (o?.weight_tons && Number(o.weight_tons) > 10) setHeavyOpen(true);
                bid(o);
              }}
            />
          )}

          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <Button onClick={() => dispatch({ type: "GO_STEP", step: 2 })}>Sozlamalar</Button>
            <Button danger onClick={() => dispatch({ type: "GO_STEP", step: 1 })}>Yakunlash</Button>
          </div>
        </div>
      ) : null}

      <HeavyLoadAlert open={heavyOpen} onClose={() => setHeavyOpen(false)} tons={12} />
      <WeighStationInfo open={weighOpen} onClose={() => setWeighOpen(false)} />
    </div>
  );
}

export default function FreightPage() {
  return (
    <FreightProvider>
      <FreightInner />
    </FreightProvider>
  );
}
