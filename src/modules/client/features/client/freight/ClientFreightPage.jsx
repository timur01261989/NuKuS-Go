import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useClientText } from "../shared/i18n_clientLocalize";
import { Avatar, Button, Card, Divider, List, message, Typography } from "antd";
import { SendOutlined, ReloadOutlined, StopOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { statusTag } from "./ClientFreightPage.helpers.jsx";

import FreightMap from "./map/FreightMap";
import { FreightProvider, useFreight } from "./context/FreightContext";
import TruckSelector from "./components/Selection/TruckSelector";
import CargoPhotoUpload from "./components/Details/CargoPhotoUpload";
import LoadersCounter from "./components/Details/LoadersCounter";
import CargoForm from "./components/Details/CargoForm";

import { freightSdk } from "@/modules/shared/domain/freight/freightSdk.js";
import { normalizeFreightStatus, isFreightTerminalStatus } from "@/modules/shared/domain/freight/statusMap.js";
import { logisticsLogger } from "@/modules/shared/domain/logistics/logisticsLogger.js";
import { formatUZS } from "./services/truckData";
import { useAuth } from "@/modules/shared/auth/AuthProvider";
import { supabase } from "@/services/supabase/supabaseClient";
import { subscribeClientCargo } from "@/services/freightService";
import { supportAssets } from "@/assets/support";

const { Title, Text } = Typography;

function Inner() {
  const { user } = useAuth();
  const { cp } = useClientText();
  const {
    truck,
    pickup,
    dropoff,
    cargoName,
   cargoType,
    weightKg,
    volumeM3,
    note,
    loadersEnabled,
    loadersCount,
    estimatedPrice,
    distanceKm,
    selecting,
    setSelecting,
  } = useFreight();
  const effectiveCargoType = truck?.bodyType || cargoType || null;

  const [cargoId, setCargoId] = useState(() => {
    try {
      return localStorage.getItem("activeCargoId") || "";
    } catch {
      return "";
    }
  });
  const [cargo, setCargo] = useState(null);
  const [offers, setOffers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [matchedDrivers, setMatchedDrivers] = useState(0);
  const [loading, setLoading] = useState(false);

  const canPost = useMemo(() => {
    return !!user?.id && !!pickup.latlng && !!dropoff.latlng;
  }, [user?.id, pickup.latlng, dropoff.latlng]);

  const refresh = useCallback(
    async (opts = {}) => {
      if (!cargoId) return;
      const silent = !!opts.silent;
      if (!silent) setLoading(true);
      try {
        const st = await freightSdk.cargoStatus({ cargoId });
        const c = st?.data?.cargo || st?.cargo;
        const o = st?.data?.offers || st?.offers || [];
        const normalizedCargo = c ? { ...c, status: normalizeFreightStatus(c?.status) } : null;
        setCargo(normalizedCargo);
        setOffers(Array.isArray(o) ? o : []);
        if (normalizedCargo && isFreightTerminalStatus(normalizedCargo.status)) {
          try { localStorage.removeItem("activeCargoId"); } catch {}
        }

        // matches are optional (for “Mos mashinalar” panel)
        try {
          const m = await freightSdk.matchVehicles({ cargoId, radiusKm: 30 });
          const mm = m?.data?.data || m?.data || [];
          setMatches(Array.isArray(mm) ? mm : []);
        } catch (error) {
          logisticsLogger.warn("freight", "matchVehicles", { message: error?.message || "match failed", cargoId });
        }
      } catch (e) {
        logisticsLogger.error("freight", "cargoStatus", { message: e?.message || "Status olishda xatolik", cargoId });
        if (!silent) message.error(e?.message || "Status olishda xatolik");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [cargoId]
  );

  // Poll offers/status for active cargo
  useEffect(() => {
    if (!cargoId) return;
    let alive = true;
    let t = null;

    const safeRefresh = () => {
      if (!alive) return;
      if (t) clearTimeout(t);
      t = setTimeout(() => {
        if (!alive) return;
        refresh({ silent: true });
      }, 500);
    };

    // Realtime (fast): offers/status update -> refresh
    const unsubscribe = subscribeClientCargo({
      cargoId,
      onChange: safeRefresh,
    });

    // Poll fallback (slow)
    const iid = setInterval(() => safeRefresh(), 12000);
    safeRefresh();

    return () => {
      alive = false;
      if (t) clearTimeout(t);
      clearInterval(iid);
      unsubscribe();
    };
  }, [cargoId, refresh]);

  const postCargo = useCallback(async () => {
    if (!canPost) return message.error("Avval kirish qiling va nuqtalarni belgilang");
    const hide = message.loading(cp("Yuk joylanmoqda..."), 0);
    try {
      const payload = {
        pickup,
        dropoff,
        cargoName,
        effectiveCargoType,
        weightKg,
        volumeM3,
        note,
        // Bu yerda oldingi taxminiy narxni budget sifatida yuboramiz (majburiy emas)
        budget: Math.round(Number(estimatedPrice) || 0) || null,
        loadersEnabled,
        loadersCount: loadersEnabled ? Number(loadersCount || 0) : 0,
        // truck tanlovi: hozircha “tavsiya” sifatida qoladi (backend matching capacity asosida)
        title: cargoName || (truck?.title ? `${cp("Yuk")}: ${truck.title}` : cp("Yuk")),
      };
      const res = await freightSdk.createCargo(payload);
      const id = res?.data?.data?.id || res?.data?.id || res?.id;
      if (!id) throw new Error("Serverdan cargoId kelmadi");
      setCargoId(String(id));
      try {
        localStorage.setItem("activeCargoId", String(id));
      } catch {}
      message.success(cp("Yuk e’loni yaratildi. Endi haydovchilar taklif yuboradi."));
      // show immediate movement: how many drivers can see it
      try {
        const m = await freightSdk.matchVehicles({ cargoId: String(id), radiusKm: 30 });
        const mm = m?.data?.data || m?.data || [];
        setMatchedDrivers(Array.isArray(mm) ? mm.length : 0);
      } catch {
        setMatchedDrivers(0);
      }
      await refresh({ silent: true });
    } catch (e) {
      console.error(e);
      message.error("Xatolik: " + (e?.message || "Server bilan aloqa yo‘q"));
    } finally {
      hide();
    }
  }, [canPost, user?.id, pickup, dropoff, cargoName, effectiveCargoType, weightKg, volumeM3, note, estimatedPrice, loadersEnabled, loadersCount, truck, refresh]);

  const doCancel = useCallback(async () => {
    if (!cargoId) return;
    const hide = message.loading("Bekor qilinmoqda...", 0);
    try {
      await freightSdk.cancelCargo({ cargoId, actorId: user?.id || null });
      setCargoId("");
      setCargo(null);
      setOffers([]);
      setMatches([]);
      try {
        localStorage.removeItem("activeCargoId");
      } catch {}
      message.success("Bekor qilindi");
    } catch (e) {
      message.error("Bekor qilishda xatolik: " + (e?.message || ""));
    } finally {
      hide();
    }
  }, [cargoId, user?.id]);

  const doAcceptOffer = useCallback(
    async (offerId) => {
      if (!cargoId || !offerId) return;
      const hide = message.loading("Taklif qabul qilinmoqda...", 0);
      try {
        await freightSdk.acceptOffer({ cargoId, offerId });
        message.success(cp("Haydovchi tanlandi ✅"));
        await refresh({ silent: true });
      } catch (e) {
        message.error("Xatolik: " + (e?.message || ""));
      } finally {
        hide();
      }
    },
    [cargoId, user?.id, refresh]
  );

  // Active cargo view
  if (cargoId) {
    const st = cargo?.status;
    const budget = cargo?.budget ?? null;
    const selected = cargo?.selected_offer_id;
    const activeOffers = (offers || []).filter((o) => o.status === "sent" || o.status === "accepted");

    return (
      <div style={{ padding: 14, maxWidth: 840, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><img src={supportAssets.services.truckAlt || supportAssets.services.truck} alt="" style={{ width: 18, height: 18, objectFit: "contain" }} /><Title level={4} style={{ margin: 0 }}>{cp("Yuk tashish")}</Title></div>
            <Text type="secondary" style={{ fontSize: 12 }}>{cp("Yuk e’loni va haydovchi takliflari.")}</Text>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {statusTag(st)}
            <Button icon={<ReloadOutlined />} onClick={() => refresh({ silent: false })} loading={loading} />
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <FreightMap />
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.85 }}>
            Masofa: <b>{distanceKm ? `${Number(distanceKm).toFixed(1)} km` : "-"}</b>
          </div>
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.85, display: "flex", gap: 14, flexWrap: "wrap" }}>
            <span>
              Mos haydovchilar: <b>{matchedDrivers || matches?.length || 0}</b>
            </span>
            <span>
              Takliflar: <b>{activeOffers.length}</b>
            </span>
            {activeOffers.length === 0 ? <span style={{ opacity: 0.7 }}>Taklif tezroq kelishi uchun haydovchilar realtime ko‘radi.</span> : null}
          </div>
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
          <Card className="unigo-surface-card" style={{ borderRadius: 24 }} bodyStyle={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 1000 }}>{cp("Yuk")}: {cargo?.title || "-"}</div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>
                  {cargo?.weight_kg ? `${cargo.weight_kg} kg` : ""}{cargo?.volume_m3 ? ` • ${cargo.volume_m3} m³` : ""}
                  {budget ? ` • budget: ${formatUZS(budget)}` : ""}
                </div>
              </div>
              {st !== "cancelled" && st !== "closed" && (
                <Button danger icon={<StopOutlined />} onClick={doCancel}>
                  Bekor qilish
                </Button>
              )}
            </div>
            {cargo?.description ? (
              <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>{cargo.description}</div>
            ) : null}
          </Card>

          <Card className="unigo-surface-card" style={{ borderRadius: 24 }} bodyStyle={{ padding: 16 }}>
            <div style={{ fontWeight: 1000, marginBottom: 10 }}>{cp("Haydovchi takliflari")}</div>
            {activeOffers.length === 0 ? (
              <div style={{ fontSize: 12, opacity: 0.75 }}>
                {cp("Hozircha taklif yo‘q. Haydovchilar onlayn bo‘lsa taklif yuboradi.")}
              </div>
            ) : (
              <List
                dataSource={activeOffers}
                renderItem={(o) => {
                  const isAccepted = o.status === "accepted" || o.id === selected;
                  return (
                    <List.Item
                      actions={
                        isAccepted
                          ? [<Tag key="acc" color="green" icon={<CheckCircleOutlined />}>{cp("Tanlangan")}</Tag>]
                          : [
                              <Button key="pick" type="primary" onClick={() => doAcceptOffer(o.id)}>
                                Tanlash
                              </Button>,
                            ]
                      }
                    >
                      <List.Item.Meta
                        title={<span style={{ fontWeight: 900 }}>{formatUZS(o.price)} {o.eta_minutes ? <Text type="secondary">• {o.eta_minutes} min</Text> : null}</span>}
                        description={o.note ? <span style={{ fontSize: 12 }}>{o.note}</span> : <span style={{ fontSize: 12, opacity: 0.75 }}>{cp("Izoh yo‘q")}</span>}
                      />
                    </List.Item>
                  );
                }}
              />
            )}
          </Card>

          <Card className="unigo-surface-card" style={{ borderRadius: 24 }} bodyStyle={{ padding: 16 }}>
            <div style={{ fontWeight: 1000, marginBottom: 10 }}>Mos mashinalar (informatsion)</div>
            <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 10 }}>
              Bu ro‘yxat — kimlar potensial mos. Real tanlov taklif (offer) orqali bo‘ladi.
            </div>
            <List
              size="small"
              dataSource={(matches || []).slice(0, 10)}
              locale={{ emptyText: "Mos mashina topilmadi (yoki hali online yo‘q)" }}
              renderItem={(m) => {
                const v = m.vehicle || {};
                return (
                  <List.Item>
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%", gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 900 }}>{v.title || cp("Yuk mashina")} {v.plate_number ? <Text type="secondary">• {v.plate_number}</Text> : null}</div>
                        <div style={{ fontSize: 12, opacity: 0.75 }}>
                          {v.body_type ? `Turi: ${v.body_type}` : ""}
                          {Number.isFinite(v.capacity_kg) ? ` • ${v.capacity_kg} kg` : ""}
                        </div>
                        {m.driver_stats ? (
                          <div style={{ marginTop: 4, fontSize: 12, display: "flex", gap: 10, flexWrap: "wrap", opacity: 0.85 }}>
                            {Number.isFinite(m.driver_stats.deliveredCount) ? <span>✔ {m.driver_stats.deliveredCount} ta yetkazilgan</span> : null}
                            {Number.isFinite(m.driver_stats.ratingAvg) ? <span>⭐ {m.driver_stats.ratingAvg} ({m.driver_stats.ratingCount || 0})</span> : null}
                            {m.driver_stats.lastActiveAt ? (
                              <span>
                                🕒 Oxirgi aktiv:{" "}
                                {(() => {
                                  const ms = Date.now() - new Date(m.driver_stats.lastActiveAt).getTime();
                                  const min = Math.max(0, Math.round(ms / 60000));
                                  if (!Number.isFinite(min)) return "—";
                                  if (min < 60) return `${min} min`;
                                  const h = Math.round(min / 60);
                                  return `${h} soat`;
                                })()}
                              </span>
                            ) : null}
                            {m.driver_stats.isVerified ? <span>✅ Tasdiqlangan</span> : null}
                          </div>
                        ) : null}
                      </div>
                      <div style={{ textAlign: "right", fontSize: 12, opacity: 0.75 }}>
                        {Number.isFinite(m.dist_from_km) ? `${m.dist_from_km.toFixed(1)} km` : ""}
                      </div>
                    </div>
                  </List.Item>
                );
              }}
            />
          </Card>
        </div>
      </div>
    );
  }

  // Create cargo view
  return (
    <div className="unigo-page" style={{ padding: 14, maxWidth: 840, margin: "0 auto", paddingBottom: 96 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><img src={supportAssets.services.truckAlt || supportAssets.services.truck} alt="" style={{ width: 18, height: 18, objectFit: "contain" }} /><Title level={4} style={{ margin: 0 }}>{cp("Yuk tashish")}</Title></div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {cp("Nuqtalarni belgilang, yuk detallarini to‘ldiring va e’lon qiling — haydovchilar taklif yuboradi.")}
          </Text>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, opacity: 0.7 }}>Taxminiy budget</div>
          <div style={{ fontWeight: 1000, fontSize: 18 }}>{formatUZS(estimatedPrice)}</div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <FreightMap />
      </div>

      <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
        
        <Card className="unigo-surface-card" style={{ borderRadius: 24 }} bodyStyle={{ padding: 16 }}>
          <div style={{ fontWeight: 1000, marginBottom: 10 }}>{cp("Manzillar")}</div>
          <div style={{ display: "grid", gap: 10 }}>
            <Button
              size="large"
              type={selecting === "pickup" ? "primary" : "default"}
              onClick={() => setSelecting("pickup")}
              style={{ borderRadius: 16, textAlign: "left", height: "auto", padding: "12px 14px" }}
            >
              <div style={{ fontWeight: 900 }}>{cp("Yuborish manzili")}</div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>
                {pickup?.address ? pickup.address : cp("Xaritadan belgilang")}
              </div>
            </Button>

            <Button
              size="large"
              type={selecting === "dropoff" ? "primary" : "default"}
              onClick={() => setSelecting("dropoff")}
              style={{ borderRadius: 16, textAlign: "left", height: "auto", padding: "12px 14px" }}
            >
              <div style={{ fontWeight: 900 }}>{cp("Tushirish manzili")}</div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>
                {dropoff?.address ? dropoff.address : cp("Xaritadan belgilang")}
              </div>
            </Button>
          </div>

          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 10 }}>
            {cp("Tugmani bossangiz xarita kattalashadi — pinni joylab Manzilni saqlash ni bosing.")}
          </div>
        </Card>

<Card className="unigo-surface-card" style={{ borderRadius: 24 }} bodyStyle={{ padding: 16 }}>
          <div style={{ fontWeight: 1000, marginBottom: 10 }}>Mashina sinfi (tavsiya)</div>
          <TruckSelector />
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 8 }}>
            Eslatma: yakuniy tanlovni haydovchi takliflari orqali qilasiz.
          </div>
        </Card>

        <Card className="unigo-surface-card" style={{ borderRadius: 24 }} bodyStyle={{ padding: 16 }}>
          <div style={{ fontWeight: 1000, marginBottom: 10 }}>{cp("Yuk detali")}</div>
          <div style={{ display: "grid", gap: 12 }}>
            <CargoPhotoUpload />
            <Divider style={{ margin: "8px 0" }} />
            <LoadersCounter />
            <Divider style={{ margin: "8px 0" }} />
            <CargoForm />
          </div>
        </Card>

        <div className="unigo-sticky-cta">
          <Button
            type="primary"
            size="large"
            icon={<SendOutlined />}
            style={{ width: "100%", borderRadius: 18, height: 52, fontWeight: 900 }}
            onClick={postCargo}
            disabled={!canPost}
          >
            {cp("Yukni e’lon qilish")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ClientFreightPage() {
  return (
    <FreightProvider>
      <Inner />
    </FreightProvider>
  );
}