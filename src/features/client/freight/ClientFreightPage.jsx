import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Divider, message, Typography } from "antd";
import { SendOutlined } from "@ant-design/icons";

import FreightMap from "./map/FreightMap";
import { FreightProvider, useFreight } from "./context/FreightContext";
import TruckSelector from "./components/Selection/TruckSelector";
import CargoPhotoUpload from "./components/Details/CargoPhotoUpload";
import LoadersCounter from "./components/Details/LoadersCounter";
import CargoForm from "./components/Details/CargoForm";
import PriceEstimator from "./components/Order/PriceEstimator";
import ActiveFreightPanel from "./components/Order/ActiveFreightPanel";

import { createFreightOrder, cancelFreightOrder, freightStatus } from "./services/freightApi";
import { formatUZS } from "./services/truckData";

const { Title, Text } = Typography;

function InnerFreightPage() {
  const { truck, pickup, dropoff, cargoName, note, loadersEnabled, loadersCount, distanceKm, estimatedPrice } = useFreight();

  const [mode, setMode] = useState("");
  const [assignedDriver, setAssignedDriver] = useState(null);
  const [orderId, setOrderId] = useState(() => {
    try { return localStorage.getItem("activeFreightOrderId") || ""; } catch { return ""; }
  });

  const canOrder = useMemo(() => !!pickup.latlng && !!truck?.id, [pickup.latlng, truck?.id]);

  const handleCreate = useCallback(async () => {
    if (!canOrder) return message.error("Avval yuklash joyini belgilang");
    const hide = message.loading("Buyurtma yuborilmoqda...", 0);
    try {
      const payload = {
        truckId: truck.id,
        pickup,
        dropoff,
        distanceKm: Number(distanceKm) || 0,
        loadersEnabled: !!loadersEnabled,
        loadersCount: loadersEnabled ? Number(loadersCount) || 0 : 0,
        cargoName,
        note,
        price: Math.round(Number(estimatedPrice) || 0),
      };
      const res = await createFreightOrder(payload);
      const id = res?.data?.id || res?.id || res?.orderId;
      if (!id) throw new Error("Serverdan ID kelmadi");
      setOrderId(String(id));
      try { localStorage.setItem("activeFreightOrderId", String(id)); } catch {}
      setMode("searching");
      message.success("Buyurtma yuborildi");
    } catch (e) {
      console.error(e);
      message.error("Xatolik: " + (e?.message || "Server bilan aloqa yo‘q"));
    } finally {
      hide();
    }
  }, [canOrder, truck, pickup, dropoff, distanceKm, loadersEnabled, loadersCount, cargoName, note, estimatedPrice]);

  const handleCancel = useCallback(async () => {
    if (!orderId) { setMode(""); return; }
    const hide = message.loading("Bekor qilinmoqda...", 0);
    try {
      await cancelFreightOrder(orderId);
      setMode("");
      setAssignedDriver(null);
      setOrderId("");
      try { localStorage.removeItem("activeFreightOrderId"); } catch {}
      message.success("Bekor qilindi");
    } catch (e) {
      message.error("Bekor qilishda xatolik: " + (e?.message || ""));
    } finally {
      hide();
    }
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    let stopped = false;
    const tick = async () => {
      try {
        const res = await freightStatus(orderId);
        const st = res?.data?.status || res?.status || res?.orderStatus;
        const drv = res?.data?.driver || res?.driver || res?.assignedDriver;
        if (stopped) return;
        if (drv) setAssignedDriver(drv);
        if (st === "accepted" || st === "coming") setMode("coming");
        else if (st === "searching") setMode("searching");
        else if (st === "cancelled" || st === "completed") {
          setMode("");
          setAssignedDriver(null);
          setOrderId("");
          try { localStorage.removeItem("activeFreightOrderId"); } catch {}
        }
      } catch {}
    };
    const iid = setInterval(tick, 4000);
    tick();
    return () => { stopped = true; clearInterval(iid); };
  }, [orderId]);

  return (
    <div style={{ padding: 14, maxWidth: 760, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Yuk mashina</Title>
          <Text type="secondary" style={{ fontSize: 12 }}>Yuklash/tushirish nuqtalarini belgilang, mashinani tanlang.</Text>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, opacity: 0.7 }}>Taxminiy</div>
          <div style={{ fontWeight: 1000, fontSize: 18 }}>{formatUZS(estimatedPrice)}</div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <FreightMap />
      </div>

      <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
        <Card style={{ borderRadius: 18 }} bodyStyle={{ padding: 14 }}>
          <div style={{ fontWeight: 1000, marginBottom: 10 }}>Mashina turini tanlang</div>
          <TruckSelector />
        </Card>

        <Card style={{ borderRadius: 18 }} bodyStyle={{ padding: 14 }}>
          <div style={{ fontWeight: 1000, marginBottom: 10 }}>Yuk detali</div>
          <div style={{ display: "grid", gap: 12 }}>
            <CargoPhotoUpload />
            <Divider style={{ margin: "8px 0" }} />
            <LoadersCounter />
            <Divider style={{ margin: "8px 0" }} />
            <CargoForm />
          </div>
        </Card>

        <PriceEstimator />

        <div style={{ position: "sticky", bottom: 12, zIndex: 5 }}>
          {mode ? (
            <ActiveFreightPanel mode={mode} onCancel={handleCancel} />
          ) : (
            <Button type="primary" size="large" icon={<SendOutlined />} style={{ width: "100%", borderRadius: 18, height: 52, fontWeight: 900 }} onClick={handleCreate} disabled={!canOrder}>
              Buyurtma berish
            </Button>
          )}
        </div>
      </div>

      {mode === "coming" && assignedDriver && (
        <div style={{ marginTop: 12 }}>
          <Card style={{ borderRadius: 18 }} bodyStyle={{ padding: 14 }}>
            <div style={{ fontWeight: 1000, marginBottom: 6 }}>Haydovchi</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {assignedDriver?.first_name || "Haydovchi"} • {assignedDriver?.car_model || ""} • {assignedDriver?.car_plate || ""}
            </Text>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function ClientFreightPage() {
  return (
    <FreightProvider>
      <InnerFreightPage />
    </FreightProvider>
  );
}
