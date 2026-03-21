import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useClientText } from '../shared/i18n_clientLocalize';
import { osrmRoute } from "../shared/geo/osrm";
import { haversineKm } from "../shared/geo/haversine";
import { nominatimReverse as _nominatimReverse } from "../shared/geo/nominatim";


// UI components ONLY from antd
import {
  Button,
  Card,
  Drawer,
  List,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";

// Icons ONLY from @ant-design/icons
import {
  AimOutlined,
  ArrowLeftOutlined,
  EnvironmentOutlined,
  ExclamationCircleOutlined,
  FlagOutlined,
} from "@ant-design/icons";

import { MapContainer, Marker, Polyline, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import api from "@/modules/shared/utils/apiHelper";
import { supabase } from "@/services/supabase/supabaseClient";
import { playAliceVoice } from "@/modules/shared/utils/AudioPlayer";
import {
  CenterTracker,
  FitRoute,
  FlyTo,
  TARIFFS,
  carIcon,
  clamp,
  destMarkerIcon,
  fmtMoney,
  nominatimSearch,
  pickupMarkerIcon,
  randAround,
} from "./clientOrderCreate.helpers";
import {
  AcceptedPanel,
  ChatModal,
  DetailsDrawer,
  RatingModal,
  YG_STYLES,
} from "./clientOrderCreate.sections.jsx";

// Backward-compatible signature (lat, lng, signal)
async function nominatimReverse(lat, lng, signal) {
  return _nominatimReverse(lat, lng, { signal });
}


const { Text, Title } = Typography;

/**
 * PREMIUM-LIKE CITY TAXI ORDER CREATE (single-file)
 * - Map center pin with lift while dragging
 * - Pickup = center of map on main screen
 * - Destination can be typed or selected via map center
 * - Route + distance via OSRM (fallback: straight line)
 * - Tariffs + total price
 * - Create order even without destination
 * - Searching screen with waves + nearby cars simulation
 * - Accepted screen with driver tracking + chat + details
 */

/** ----------------------------- Helpers ----------------------------- */

/** ----------------------------- Main Component ----------------------------- */

export default function ClientOrderCreatePremiumStyle() {
  // --- core states ---
  const [stage, setStage] = useState("home");
  // stages:
  // home -> dest_sheet -> dest_map -> confirm -> searching -> accepted

  const [drawerOpen, setDrawerOpen] = useState(true);
  const [destSheetOpen, setDestSheetOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);

  const [userLoc, setUserLoc] = useState(null);
  const [pickup, setPickup] = useState({ latlng: null, address: "" });
  const [dest, setDest] = useState({ latlng: null, address: "" });

  const [selecting, setSelecting] = useState(null); // null | 'pickup' | 'dest'
  const [isDragging, setIsDragging] = useState(false);

  const [tariff, setTariff] = useState(TARIFFS[0]);
  const [routeCoords, setRouteCoords] = useState([]);
  const [distanceKm, setDistanceKm] = useState(null);
  const [durationMin, setDurationMin] = useState(null);
  const approxDistanceKm = useMemo(() => {
    if (pickup.latlng && dest.latlng) return haversineKm(pickup.latlng, dest.latlng);
    return null;
  }, [pickup.latlng, dest.latlng]);

  const totalPrice = useMemo(() => {
    // If destination not selected yet, show base price only.
    const km = distanceKm ?? approxDistanceKm;
    if (!km || !Number.isFinite(km)) return tariff.base;
    return tariff.base + km * tariff.perKm;
  }, [tariff, distanceKm, approxDistanceKm]);

  // --- search input / history ---
  const [destQuery, setDestQuery] = useState("");
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("taxiHistory") || "[]");
    } catch {
      return [];
    }
  });

  // --- order states ---
  const [orderId, setOrderId] = useState(() => localStorage.getItem("activeOrderId") || "");
  const [orderStatus, setOrderStatus] = useState(null); // searching | accepted | arrived | completed | canceled
  const [assignedDriver, setAssignedDriver] = useState(null);

  // --- searching animation / cars ---
  const [nearCars, setNearCars] = useState([]);
  const [activeCarIdx, setActiveCarIdx] = useState(0);

  // --- chat state ---
  const [messagesState, setMessagesState] = useState([]);
  const [msgText, setMsgText] = useState("");
  const chatScrollRef = useRef(null);

  // --- refs ---
  const mapRef = useRef(null);
  const reverseAbortRef = useRef(null);
  const searchAbortRef = useRef(null);
  const pollRef = useRef(null);

  // Dispatch safety: avoid spamming /api/dispatch and avoid overlapping requests
  const dispatchInFlightRef = useRef(false);
  const lastDispatchAttemptRef = useRef(0);

  const isNight = useMemo(() => document.body.classList.contains("night-mode-active"), []);

  /** ----------------------------- Location init ----------------------------- */
  useEffect(() => {
    let alive = true;
    const fallback = [42.4602, 59.6176]; // Nukus-ish (fallback)

    const onOk = (pos) => {
      if (!alive) return;
      const c = [pos.coords.latitude, pos.coords.longitude];
      setUserLoc(c);
      setPickup((p) => ({ ...p, latlng: c }));
      // reverse pickup
      (async () => {
        const addr = await nominatimReverse(c[0], c[1]);
        if (addr && alive) setPickup({ latlng: c, address: addr });
      })();
    };

    const onErr = async () => {
      if (!alive) return;
      setUserLoc(fallback);
      setPickup({ latlng: fallback, address: "" });
      const addr = await nominatimReverse(fallback[0], fallback[1]);
      if (addr && alive) setPickup({ latlng: fallback, address: addr });
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(onOk, onErr, {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 4000,
      });
    } else {
      onErr();
    }

    return () => {
      alive = false;
    };
  }, []);

  /** ----------------------------- Active order check (server-side) ----------------------------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.post("/api/order", { action: "active" });
        const active = res?.data || res;
        if (!alive) return;
        if (active?.id) {
          setOrderId(String(active.id));
          localStorage.setItem("activeOrderId", String(active.id));
          setOrderStatus(active.status || "searching");
          setAssignedDriver(active.assigned_driver || active.assignedDriver || null);
          // load pickup/dest if server has it
          if (active.from_lat && active.from_lng) {
            setPickup((p) => ({ ...p, latlng: [active.from_lat, active.from_lng], address: active.pickup_location || p.address }));
          }
          if (active.to_lat && active.to_lng) {
            setDest((d) => ({ ...d, latlng: [active.to_lat, active.to_lng], address: active.dropoff_location || d.address }));
          }
          // switch stage
          if ((active.status || "").toLowerCase() === "accepted") {
            setStage("accepted");
            setDrawerOpen(false);
          } else {
            setStage("searching");
            setDrawerOpen(false);
          }
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /** ----------------------------- Suggest / History ----------------------------- */
  useEffect(() => {
    if (!destSheetOpen) return;
    const q = destQuery.trim();
    if (!q) {
      setDestSuggestions([]);
      return;
    }

    if (searchAbortRef.current) searchAbortRef.current.abort();
    const ac = new AbortController();
    searchAbortRef.current = ac;

    const t = setTimeout(async () => {
      const list = await nominatimSearch(q, ac.signal);
      setDestSuggestions(list);
    }, 260);

    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [destQuery, destSheetOpen]);

  const saveHistory = useCallback(
    (item) => {
      const next = [item, ...history.filter((x) => x.id !== item.id)].slice(0, 10);
      setHistory(next);
      localStorage.setItem("taxiHistory", JSON.stringify(next));
    },
    [history]
  );

  /** ----------------------------- Center picked (reverse geocode with debounce/abort) ----------------------------- */
  const handleCenterPicked = useCallback(
    async (latlng) => {
      if (!selecting) return;

      // update instantly
      if (selecting === "pickup") {
        setPickup((p) => ({ ...p, latlng }));
      } else {
        setDest((d) => ({ ...d, latlng }));
      }

      // Debounced reverse
      if (reverseAbortRef.current) reverseAbortRef.current.abort();
      const ac = new AbortController();
      reverseAbortRef.current = ac;

      const addr = await nominatimReverse(latlng[0], latlng[1], ac.signal);
      if (!addr) return;

      if (selecting === "pickup") {
        setPickup({ latlng, address: addr });
      } else {
        setDest({ latlng, address: addr });
      }
    },
    [selecting]
  );

  /** ----------------------------- Route build (when both points selected) ----------------------------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!pickup.latlng || !dest.latlng) {
        setRouteCoords([]);
        setDistanceKm(null);
        setDurationMin(null);
        return;
      }
      const r = await osrmRoute(pickup.latlng, dest.latlng);
      if (!alive) return;
      setRouteCoords(r.coords || []);
      setDistanceKm(r.distanceKm ?? null);
      setDurationMin(r.durationMin ?? null);
    })();
    return () => {
      alive = false;
    };
  }, [pickup.latlng, dest.latlng]);

  /** ----------------------------- Searching (cars simulation & active line) ----------------------------- */
  useEffect(() => {
    if (stage !== "searching" || !pickup.latlng) return;

    // create cars around pickup
    const cars = new Array(6).fill(0).map(() => {
      const pos = randAround(pickup.latlng, 2200);
      const bearing = Math.floor(Math.random() * 360);
      return { id: crypto.randomUUID?.() || String(Math.random()), pos, bearing };
    });
    setNearCars(cars);
    setActiveCarIdx(0);

    const timer = setInterval(() => {
      setActiveCarIdx((i) => (i + 1) % Math.max(1, cars.length));
    }, 2200);

    return () => clearInterval(timer);
  }, [stage, pickup.latlng]);

  /** ----------------------------- Poll order status ----------------------------- */
  const startPolling = useCallback(
    (id) => {
      if (!id) return;
      if (pollRef.current) clearInterval(pollRef.current);

      pollRef.current = setInterval(async () => {
        try {
          const res = await api.post("/api/order", { action: "status", id });
          const st = (res?.data?.status || res?.status || "").toLowerCase();
          if (!st) return;

          setOrderStatus(st);
          const driver = res?.data?.assigned_driver || res?.assigned_driver || res?.assignedDriver || null;
          if (driver) setAssignedDriver(driver);

// Retry dispatch while still searching (prevents "stuck" orders when driver doesn't respond)
if (st === "searching" && !driver) {
  const nowTs = Date.now();
  if (!dispatchInFlightRef.current && nowTs - lastDispatchAttemptRef.current >= 6000) {
    dispatchInFlightRef.current = true;
    lastDispatchAttemptRef.current = nowTs;
    try {
      await api.post("/api/dispatch", { order_id: String(id) });
    } catch {
      // ignore dispatch retry errors (next tick will retry)
    } finally {
      dispatchInFlightRef.current = false;
    }
  }
}

          if (st === "accepted" || st === "arrived") {
            setStage("accepted");
          }
          if (st === "completed") {
            setStage("home");
            setDrawerOpen(true);
            setDestSheetOpen(false);
            setDetailsOpen(false);
            setChatOpen(false);
            setOrderId("");
            setOrderStatus(null);
            setAssignedDriver(null);
            localStorage.removeItem("activeOrderId");
            setRatingOpen(true);
          }
          if (st === "canceled") {
            setStage("home");
            setDrawerOpen(true);
            setDestSheetOpen(false);
            setDetailsOpen(false);
            setChatOpen(false);
            setOrderId("");
            setOrderStatus(null);
            setAssignedDriver(null);
            localStorage.removeItem("activeOrderId");
            message.info("Buyurtma bekor qilindi");
          }
        } catch {
          // ignore
        }
      }, 2500);
    },
    [setOrderStatus]
  );

  useEffect(() => {
    if (!orderId) return;
    startPolling(orderId);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [orderId, startPolling]);

  /** ----------------------------- Track driver on map ----------------------------- */
  // If assignedDriver has lat/lng -> fly map to driver when accepted
  useEffect(() => {
    if (stage !== "accepted") return;
    const lat = assignedDriver?.lat ?? assignedDriver?.driver_lat ?? assignedDriver?.current_lat;
    const lng = assignedDriver?.lng ?? assignedDriver?.driver_lng ?? assignedDriver?.current_lng;
    if (!lat || !lng) return;
    const m = mapRef.current;
    if (!m) return;
    m.flyTo([lat, lng], Math.max(15, m.getZoom() || 16), { duration: 0.6 });
  }, [stage, assignedDriver]);

  /** ----------------------------- Chat realtime logic ----------------------------- */
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      chatScrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 80);
  }, []);

  useEffect(() => {
    if (!chatOpen || !orderId) return;

    // 1) history
    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMessagesState(data);
        scrollToBottom();
      }
    };

    fetchHistory();

    // 2) realtime
    const channel = supabase
      .channel(`chat_room:${orderId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `order_id=eq.${orderId}` },
        (payload) => {
          setMessagesState((prev) => [...prev, payload.new]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatOpen, orderId, scrollToBottom]);

  const handleSendMessage = useCallback(async () => {
    if (!msgText.trim() || !orderId) return;
    const textToSend = msgText.trim();
    setMsgText("");

    await supabase.from("messages").insert([
      {
        order_id: orderId,
        sender_role: "client",
        content: textToSend,
        created_at: new Date().toISOString(),
      },
    ]);
  }, [msgText, orderId]);

  /** ----------------------------- Actions ----------------------------- */

  const openDestSheet = useCallback(() => {
    setDestSheetOpen(true);
    setStage("dest_sheet");
    setDrawerOpen(false);
  }, []);

  const goBackToHome = useCallback(() => {
    setStage("home");
    setDestSheetOpen(false);
    setDetailsOpen(false);
    setChatOpen(false);
    setDrawerOpen(true);
    setSelecting(null);
  }, []);

  const startDestMapPick = useCallback(() => {
    // open destination picker on map center
    setStage("dest_map");
    setDestSheetOpen(false);
    setDrawerOpen(false);
    setSelecting("dest");
    // move center to current map or pickup
    const m = mapRef.current;
    if (m) {
      const c = m.getCenter();
      handleCenterPicked([c.lat, c.lng]);
    } else if (pickup.latlng) {
      handleCenterPicked(pickup.latlng);
    }
  }, [handleCenterPicked, pickup.latlng]);

  const confirmDest = useCallback(() => {
    // after dest map pick -> go to confirm stage
    setSelecting(null);
    setStage("confirm");
    setDrawerOpen(true);
  }, []);

  // handleOrder funksiyasini barqaror qilish:
  const handleOrder = useCallback(async () => {
    if (!pickup.latlng) {
      message.error(cp("Manzil topilmadi"));
      return;
    }

    const hide = message.loading("Buyurtma yuborilmoqda...", 0);
    try {
      const payload = {
        action: "create",
        status: "searching",
        price: Math.round(totalPrice),
        // Stage-3: server pricing (final price computed server-side, client price is only an estimate)
        use_server_pricing: true,
        service_type: "taxi",
        tariff_id: tariff.id,
        pickup_location: pickup.address || "Pickup",
        dropoff_location: dest.address || null,
        from_lat: pickup.latlng[0],
        from_lng: pickup.latlng[1],
        to_lat: dest.latlng ? dest.latlng[0] : null,
        to_lng: dest.latlng ? dest.latlng[1] : null,
        distance_km: distanceKm || approxDistanceKm || 0,
        duration_min: durationMin ? Math.round(durationMin) : (distanceKm || approxDistanceKm) ? Math.max(1, Math.round(((distanceKm || approxDistanceKm) || 0) * 2)) : 0,
      };

      const res = await api.post("/api/order", payload);

      const id = res?.data?.id || res?.id || res?.orderId;
      if (!id) throw new Error("Serverdan ID kelmadi");

      setOrderId(String(id));
      localStorage.setItem("activeOrderId", String(id));
      setOrderStatus("searching");

      setStage("searching");
      setDrawerOpen(false);
      setDestSheetOpen(false);
      playAliceVoice?.("order_sent");

      message.success("Buyurtma yuborildi");

      // Immediately request dispatch
      try {
        const d = await api.post("/api/dispatch", { order_id: String(id) });
        if (d?.error) throw new Error(d.error);
      } catch (e) {
        console.error("Dispatch error:", e);
        message.error(cp("Qidirishda xatolik"));
      }
    } catch (e) {
      console.error("Order error:", e);
      message.error("Zakaz berishda xatolik: " + (e?.message || "Server bilan aloqa yo'q"));
    } finally {
      hide();
    }
  }, [pickup, dest, tariff, totalPrice, distanceKm, approxDistanceKm]);

  const handleCancel = useCallback(async () => {
    if (!orderId) {
      goBackToHome();
      return;
    }

    const hide = message.loading("Bekor qilinmoqda...", 0);
    try {
      await api.post("/api/order", { action: "cancel", id: orderId });
    } catch {
      // ignore
    } finally {
      hide();
      setOrderId("");
      setOrderStatus(null);
      setAssignedDriver(null);
      localStorage.removeItem("activeOrderId");
      setStage("home");
      setDrawerOpen(true);
      setDestSheetOpen(false);
      setDetailsOpen(false);
      setChatOpen(false);
      message.success("Safar bekor qilindi");
    }
  }, [orderId, goBackToHome]);

  /** ----------------------------- Dest selection by list ----------------------------- */
  const selectDestFromSuggestion = useCallback(
    async (sug) => {
      setDest({ latlng: [sug.lat, sug.lng], address: sug.label });
      saveHistory(sug);
      setDestQuery("");
      setDestSuggestions([]);
      setDestSheetOpen(false);
      setSelecting(null);
      setStage("confirm");
      setDrawerOpen(true);

      // Fit map to show route
      setTimeout(() => {
        const m = mapRef.current;
        if (!m) return;
        if (pickup.latlng && [sug.lat, sug.lng]) {
          try {
            m.fitBounds(L.latLngBounds(pickup.latlng, [sug.lat, sug.lng]), {
              paddingTopLeft: [50, 50],
              paddingBottomRight: [50, 350],
            });
          } catch {
            // ignore
          }
        }
      }, 250);
    },
    [saveHistory, pickup.latlng]
  );

  /** ----------------------------- UI derived values ----------------------------- */

  const pickupTitle = pickup.address ? pickup.address.split(",")[0] : cp("Manzilingiz aniqlanmoqda...");
  const destTitle = dest.address ? dest.address.split(",")[0] : "Qayerga borasiz?";

  const bottomPad = stage === "home" ? 280 : 330;

  // Map center for initial view
  const mapCenter = useMemo(() => {
    return userLoc || pickup.latlng || [42.4602, 59.6176];
  }, [userLoc, pickup.latlng]);

  // route stroke (solid green)
  const routeStroke = {
    color: "#22C55E",
    weight: 8,
    opacity: 0.95,
  };

  // active driver coords if available
  const driverLatLng = useMemo(() => {
    const lat = assignedDriver?.lat ?? assignedDriver?.driver_lat ?? assignedDriver?.current_lat;
    const lng = assignedDriver?.lng ?? assignedDriver?.driver_lng ?? assignedDriver?.current_lng;
    if (lat && lng) return [Number(lat), Number(lng)];
    return null;
  }, [assignedDriver]);

  /** ----------------------------- Render ----------------------------- */

  return (
    <div className="yg-root">
      {/* MAP */}
      <div className="yg-mapWrap">
        <MapContainer
          center={mapCenter}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
          whenCreated={(map) => {
            mapRef.current = map;
          }}
          zoomControl={false}
        >
          <TileLayer
            url={
              isNight
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            }
          />

          {/* Fly to user location first */}
          <FlyTo center={mapCenter} zoom={15} />

          {/* Track center only when selecting */}
          <CenterTracker enabled={!!selecting} onCenter={handleCenterPicked} setIsDragging={setIsDragging} />

          {/* Fit route on confirm */}
          {stage === "confirm" && pickup.latlng && dest.latlng && <FitRoute from={pickup.latlng} to={dest.latlng} bottomPad={bottomPad} />}

          {/* Markers */}
          {pickup.latlng && stage !== "home" && stage !== "dest_map" && (
            <Marker position={pickup.latlng} icon={pickupMarkerIcon} />
          )}

          {dest.latlng && stage === "confirm" && <Marker position={dest.latlng} icon={destMarkerIcon} />}

          {/* Route */}
          {routeCoords.length >= 2 && stage === "confirm" && <Polyline positions={routeCoords} pathOptions={routeStroke} />}

          {/* Searching cars */}
          {stage === "searching" && nearCars.map((c) => <Marker key={c.id} position={c.pos} icon={carIcon(c.bearing)} />)}

          {/* Driver marker + line in accepted */}
          {stage === "accepted" && driverLatLng && (
            <>
              <Marker position={driverLatLng} icon={carIcon(assignedDriver?.bearing || 0)} />
              {pickup.latlng && <Polyline positions={[driverLatLng, pickup.latlng]} pathOptions={{ color: "#22C55E", weight: 7, opacity: 0.9 }} />}
            </>
          )}
        </MapContainer>

        {/* Center Pin overlay (home + dest map) */}
        {(stage === "home" || stage === "dest_map") && (
          <div className={`yg-centerpin ${isDragging ? "dragging" : ""}`} aria-hidden>
            <div
              style={{ position: "relative", width: 70, height: 86 }}
              dangerouslySetInnerHTML={{ __html: stage === "dest_map" ? svgDestPin : svgPickupPin }}
            />
            <div className="yg-pinlabel">{stage === "dest_map" ? cp("Yakuniy nuqta") : cp("Qayerdan ketasiz?")}</div>
          </div>
        )}

        {/* Locate me button */}
        <div className="yg-locate">
          <Button
            shape="circle"
            size="large"
            icon={<AimOutlined style={{ fontSize: 22 }} />}
            onClick={() => {
              const m = mapRef.current;
              if (m && userLoc) m.flyTo(userLoc, 16);
            }}
          />
        </div>

        {/* Back button (like screenshot) */}
        {(stage !== "home" && stage !== "searching" && stage !== "accepted") && (
          <div className="yg-back">
            <Button shape="circle" icon={<ArrowLeftOutlined />} onClick={goBackToHome} />
          </div>
        )}

        {/* Searching waves */}
        {stage === "searching" && (
          <div className="yg-waves">
            <div className="yg-wave" />
            <div className="yg-wave" />
            <div className="yg-wave" />
          </div>
        )}

        {/* Searching active line to a car */}
        {stage === "searching" && pickup.latlng && nearCars[activeCarIdx] && (
          <svg className="yg-aimLine" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* purely decorative - line is done by CSS gradient */}
          </svg>
        )}
      </div>

      {/* ACCEPTED */}
      {stage === "accepted" && (
        <AcceptedPanel
          assignedDriver={assignedDriver}
          pickupTitle={pickupTitle}
          setDetailsOpen={setDetailsOpen}
          setChatOpen={setChatOpen}
          message={message}
        />
      )}

      {/* HOME / CONFIRM bottom sheet (Drawer) */}
      <DetailsDrawer
        detailsOpen={detailsOpen}
        setDetailsOpen={setDetailsOpen}
        setChatOpen={setChatOpen}
        message={message}
        pickupTitle={pickupTitle}
        destTitle={destTitle}
        handleCancel={handleCancel}
      />

      {/* CHAT MODAL */}
      <ChatModal
        assignedDriver={assignedDriver}
        cp={cp}
        chatOpen={chatOpen}
        setChatOpen={setChatOpen}
        messagesState={messagesState}
        chatScrollRef={chatScrollRef}
        msgText={msgText}
        setMsgText={setMsgText}
        handleSendMessage={handleSendMessage}
      />

      {/* RATING */}
      <RatingModal ratingOpen={ratingOpen} setRatingOpen={setRatingOpen} />

      {/* styles */}
      <style>{YG_STYLES}</style>
    </div>
  );
}