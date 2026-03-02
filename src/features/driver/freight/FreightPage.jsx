import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Divider, Input, InputNumber, List, Modal, Switch, Typography, message, Select } from "antd";
import { ReloadOutlined, EnvironmentOutlined, DollarOutlined } from "@ant-design/icons";

import { useAuth } from "@/shared/auth/AuthProvider";
import { upsertVehicle, setVehicleOnline, listVehicleCargo, createOffer, quickOffer } from "./services/freightApi";
import { formatUZS } from "@/features/client/freight/services/truckData";
import { supabase } from "@/lib/supabase";
import { subscribeDriverFreight, incrementCargoViews, incrementCargoOffers, startDriverHeartbeat } from "@/services/freightService";

const { Title, Text } = Typography;

function useGeo() {
  const [pos, setPos] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => {
    if (!navigator?.geolocation) {
      message.error("Brauzer geolokatsiyani qo‘llamaydi");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLoading(false);
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
      },
      (err) => {
        setLoading(false);
        message.error(err?.message || "Joylashuvni olishda xatolik");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, []);

  return { pos, refresh, loading };
}

export default function FreightPage() {
  const { user } = useAuth();

  const [vehicleId, setVehicleId] = useState(() => {
    try {
      return localStorage.getItem("freightVehicleId") || "";
    } catch {
      return "";
    }
  });
  const [vehicle, setVehicle] = useState(null);

  const [title, setTitle] = useState("");
  const [bodyType, setBodyType] = useState("gazelle");
  const [plateNumber, setPlateNumber] = useState("");
  const [capacityKg, setCapacityKg] = useState(1500);
  const [capacityM3, setCapacityM3] = useState(8);

  const [isOnline, setIsOnline] = useState(false);
  const { pos, refresh: refreshPos, loading: geoLoading } = useGeo();

  const [feed, setFeed] = useState([]);
  const [feedLoading, setFeedLoading] = useState(false);

  // Fast matching: realtime refresh (3-4x faster than polling)
  const rtEnabled = true;
const [offerOpen, setOfferOpen] = useState(false);
  const [offerCargo, setOfferCargo] = useState(null);
  const [offerPrice, setOfferPrice] = useState(0);
  const [offerEta, setOfferEta] = useState(20);
  const [offerNote, setOfferNote] = useState("");

  const driverId = user?.id || "";

  const canOperate = useMemo(() => !!driverId, [driverId]);

  const saveVehicle = useCallback(async () => {
    if (!canOperate) return message.error("Avval haydovchi sifatida tizimga kiring");
    const hide = message.loading("Mashina saqlanmoqda...", 0);
    try {
      const payload = {
        driverId,
        vehicleId: vehicleId || undefined,
        title: title || null,
        bodyType,
        plateNumber: plateNumber || null,
        capacityKg: Number(capacityKg || 0),
        capacityM3: Number(capacityM3 || 0),
      };
      const res = await upsertVehicle(payload);
      const v = res?.data?.data || res?.data || res?.data?.vehicle || null;
      const id = v?.id || res?.data?.id || res?.id;
      if (!id) throw new Error("Serverdan vehicleId kelmadi");
      setVehicleId(String(id));
      setVehicle(v);
      try {
        localStorage.setItem("freightVehicleId", String(id));
      } catch {}
      message.success("Mashina saqlandi");
    } catch (e) {
      message.error("Xatolik: " + (e?.message || ""));
    } finally {
      hide();
    }
  }, [canOperate, driverId, vehicleId, title, bodyType, plateNumber, capacityKg, capacityM3]);

  const toggleOnline = useCallback(
    async (next) => {
      if (!vehicleId) {
        message.error("Avval mashinani saqlang");
        return;
      }
      if (next && !pos) {
        message.error("Online chiqishdan oldin joylashuvni oling");
        return;
      }
      const hide = message.loading(next ? "Online..." : "Offline...", 0);
      try {
        const res = await setVehicleOnline({
          vehicleId,
          isOnline: !!next,
          current: pos ? { latlng: pos } : null,
        });
        const v = res?.data?.data || res?.data || null;
        setVehicle(v);
        setIsOnline(!!v?.is_online);
        message.success(next ? "Online" : "Offline");
      } catch (e) {
        message.error("Xatolik: " + (e?.message || ""));
      } finally {
        hide();
      }
    },
    [vehicleId, pos]
  );


  // Heartbeat: online payti joylashuvni muntazam yangilab turamiz (fake online bo‘lmasin)
  useEffect(() => {
    if (!vehicleId || !isOnline) return;
    const stop = startDriverHeartbeat({
      vehicleId,
      intervalMs: 20000,
      getPosition: () =>
        new Promise((resolve) => {
          if (!navigator?.geolocation) return resolve(null);
          navigator.geolocation.getCurrentPosition(
            (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
            () => resolve(null),
            { enableHighAccuracy: true, maximumAge: 15000, timeout: 8000 }
          );
        }),
    });
    return () => stop?.();
  }, [vehicleId, isOnline]);
  const refreshFeed = useCallback(async () => {
    if (!vehicleId) return;
    setFeedLoading(true);
    try {
      const res = await listVehicleCargo({ vehicleId, radiusKm: 30 });
      const list = res?.data?.data || res?.data || [];
      setFeed(Array.isArray(list) ? list : []);
    } catch (e) {
      message.error(e?.message || "Yuklarni olishda xatolik");
    } finally {
      setFeedLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    if (!vehicleId || !isOnline || !rtEnabled) return;

    let alive = true;
    let t = null;
    const safeRefresh = () => {
      if (!alive) return;
      // simple debounce (many events at once)
      if (t) clearTimeout(t);
      t = setTimeout(() => {
        if (!alive) return;
        refreshFeed();
      }, 600);
    };

    const unsubscribe = subscribeDriverFreight({
      vehicleId,
      onChange: safeRefresh,
    });

    // initial refresh when go online
    safeRefresh();

    return () => {
      alive = false;
      if (t) clearTimeout(t);
      unsubscribe();
    };
  }, [vehicleId, isOnline, rtEnabled, refreshFeed]);

  useEffect(() => {
    if (!vehicleId) return;
    const iid = setInterval(() => {
      // polling fallback (realtime ishlamasa ham), realtime yoq bo'lsa intervalni kamroq ishlatamiz
      if (isOnline && !rtEnabled) refreshFeed();
    }, 6000);
    return () => clearInterval(iid);
  }, [vehicleId, isOnline, rtEnabled, refreshFeed]);

  const calcQuickPrice = useCallback((wrap) => {
    const c = wrap?.cargo || wrap;
    const distKm = Number(wrap?.dist_route_km ?? 0) || 0;
    const weightKg = Number(c?.weight_kg ?? 0) || 0;
    // Simple, practical formula (can be tuned later)
    const baseFee = 30000;
    const perKm = 4000;
    const perTon = 15000;
    const price = baseFee + distKm * perKm + (weightKg / 1000) * perTon;
    // round to nearest 1000
    return Math.max(0, Math.round(price / 1000) * 1000);
  }, []);

  const quickOffer = useCallback(
    async (cargoWrap) => {
      const c = cargoWrap?.cargo || cargoWrap;
      if (!c?.id) return;
      if (!vehicleId || !driverId) return;
      const hide = message.loading("Tez taklif yuborilmoqda...", 0);
      try {
        const resp = await quickOffer({ cargoId: c.id, vehicleId, driverId, etaMinutes: 20, note: "Tez taklif" });
        const price = resp?.data?.data?.price ?? resp?.data?.price;
        message.success(price ? `Taklif yuborildi: ${formatUZS(price)}` : "Taklif yuborildi");
        // Demand pressure: offer yuborildi -> offers_count++
        incrementCargoOffers(item?.cargo?.id);
        refreshFeed();
      } catch (e) {
        const msg = String(e?.message || "");
        if (msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("unique")) {
          message.warning("Bu yuk uchun siz allaqachon taklif yuborgansiz");
        } else {
          message.error("Xatolik: " + msg);
        }
      } finally {
        hide();
      }
    },
    [vehicleId, driverId, calcQuickPrice, refreshFeed]
  );

  const openOffer = useCallback((cargoWrap) => {
    const c = cargoWrap?.cargo || cargoWrap;
    // Demand pressure: driver yukni ochdi -> views_count++
    incrementCargoViews(c?.id);
    setOfferCargo(c);
    setOfferPrice(Number(c?.budget || 0) || 0);
    setOfferEta(20);
    setOfferNote("");
    setOfferOpen(true);
  }, []);

  const sendOffer = useCallback(async () => {
    if (!offerCargo?.id) return;
    if (!vehicleId || !driverId) return;
    const p = Number(offerPrice);
    if (!Number.isFinite(p) || p <= 0) return message.error("Narx noto‘g‘ri");

    const hide = message.loading("Taklif yuborilmoqda...", 0);
    try {
      await createOffer({
        cargoId: offerCargo.id,
        vehicleId,
        driverId,
        price: p,
        etaMinutes: Number(offerEta || 0) || null,
        note: offerNote || null,
      });
      message.success("Taklif yuborildi");
      // Demand pressure: offer yuborildi -> offers_count++
      incrementCargoOffers(offerCargo.id);
      setOfferOpen(false);
      refreshFeed();
    } catch (e) {
      message.error("Xatolik: " + (e?.message || ""));
    } finally {
      hide();
    }
  }, [offerCargo, vehicleId, driverId, offerPrice, offerEta, offerNote, refreshFeed]);

  return (
    <div style={{ padding: 14, maxWidth: 920, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Yuk tashish (haydovchi)</Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Mashinani kiriting → Online bo‘ling → Mos yuklarga taklif yuboring.
          </Text>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Button icon={<EnvironmentOutlined />} loading={geoLoading} onClick={refreshPos}>Joylashuv</Button>
          <Button icon={<ReloadOutlined />} onClick={refreshFeed} disabled={!vehicleId} loading={feedLoading} />
        </div>
      </div>

      <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
        <Card style={{ borderRadius: 18 }} bodyStyle={{ padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <div style={{ fontWeight: 1000 }}>Mening yuk mashinam</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Text type="secondary">Online</Text>
              <Switch checked={isOnline} onChange={toggleOnline} disabled={!vehicleId || !pos} />
            </div>
          </div>
          <Divider style={{ margin: "10px 0" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Nom (ixtiyoriy)</div>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Masalan: Gazel" />
            </div>
            <div>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Davlat raqami</div>
              <Input value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} placeholder="01A123BC" />
            </div>
            <div>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Turi (text)</div>
              <Input value={bodyType} onChange={(e) => setBodyType(e.target.value)} placeholder="gazelle / fura / ..." />
            </div>
            <div>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Sig‘imi</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <InputNumber style={{ width: "100%" }} min={0} value={capacityKg} onChange={(v) => setCapacityKg(Number(v || 0))} addonAfter="kg" />
                <InputNumber style={{ width: "100%" }} min={0} step={0.1} value={capacityM3} onChange={(v) => setCapacityM3(Number(v || 0))} addonAfter="m³" />
              </div>
            </div>
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button type="primary" onClick={saveVehicle} disabled={!canOperate}>Saqlash</Button>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
            Online uchun: joylashuv kerak. Hozir: {pos ? `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}` : "—"}
          </div>
        </Card>

        <Card style={{ borderRadius: 18 }} bodyStyle={{ padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
            <div style={{ fontWeight: 1000 }}>Mos yuklar (board)</div>
            {isOnline ? <Tag color="green">Online</Tag> : <Tag>Offline</Tag>}
          </div>
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
            Yuklar 30 km radius bo‘yicha saralanadi (current location).
          </div>
          <div style={{ marginTop: 8, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Button size="small" onClick={() => true}>
            </Button>
            <span style={{ fontSize: 12, opacity: 0.7 }}>
              
            </span>
          </div>
          <Divider style={{ margin: "10px 0" }} />

          <List
            loading={feedLoading}
            dataSource={feed}
            locale={{ emptyText: "Hozircha mos yuk yo‘q" }}
            renderItem={(item) => {
              const c = item.cargo;
              const quickPrice = calcQuickPrice(item);
              return (
                <List.Item
                  actions={[
                    <Button key="q" onClick={() => quickOffer(item)} disabled={!isOnline}>
                      Tez taklif {quickPrice ? `(${formatUZS(quickPrice)})` : ""}
                    </Button>,
                    <Button key="offer" icon={<DollarOutlined />} onClick={() => openOffer(item)} disabled={!isOnline}>
                      Taklif (edit)
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 900 }}>{c?.title || "Yuk"}</span>
                        {c?.budget ? <Tag color="blue">budget: {formatUZS(c.budget)}</Tag> : null}
                        <Tag>{c?.status}</Tag>
                      </div>
                    }
                    description={
                      <div style={{ fontSize: 12 }}>
                        <div style={{ opacity: 0.85 }}>
                          {c?.weight_kg ? `${c.weight_kg} kg` : ""}{c?.volume_m3 ? ` • ${c.volume_m3} m³` : ""}
                          {Number.isFinite(item.dist_from_km) ? ` • pickup: ${item.dist_from_km.toFixed(1)} km` : ""}
                          {Number.isFinite(item.dist_route_km) ? ` • yo‘l: ${Number(item.dist_route_km).toFixed(1)} km` : ""}
                        </div>
                        <div style={{ opacity: 0.7 }}>
                          {c?.from_address ? `📍 ${c.from_address}` : ""}
                          {c?.to_address ? `  →  ${c.to_address}` : ""}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        </Card>
      </div>

      <Modal
        open={offerOpen}
        onCancel={() => setOfferOpen(false)}
        onOk={sendOffer}
        okText="Yuborish"
        cancelText="Bekor"
        title="Taklif yuborish"
      >
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            Yuk: <b>{offerCargo?.title || "-"}</b>
          </div>
          <div>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Narx (so‘m)</div>
            <InputNumber style={{ width: "100%" }} min={0} value={offerPrice} onChange={(v) => setOfferPrice(Number(v || 0))} />
          </div>
          <div>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Yetib borish (min, ixtiyoriy)</div>
            <InputNumber style={{ width: "100%" }} min={0} value={offerEta} onChange={(v) => setOfferEta(Number(v || 0))} />
          </div>
          <div>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>Izoh (ixtiyoriy)</div>
            <Input.TextArea rows={3} value={offerNote} onChange={(e) => setOfferNote(e.target.value)} placeholder="Masalan: 20 daqiqada boraman" />
          </div>
        </div>
      </Modal>
    </div>
  );
}