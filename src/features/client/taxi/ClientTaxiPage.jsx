import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {


  Avatar,
  Button,
  Divider,
  Drawer,
  Input,
  List,
  Modal,
  Segmented,
  DatePicker,
  Checkbox,
  Spin,
  Switch,
  Tag,
  Typography,
  message,
} from "antd";
import {
  AimOutlined,
  HomeOutlined,
  BankOutlined,
  ArrowLeftOutlined,
  CarOutlined,
  CheckOutlined,
  CloseOutlined,
  EnvironmentOutlined,
  FlagOutlined,
  PlusOutlined,
  ShareAltOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  SettingOutlined,
  MessageOutlined,
  StarFilled,
  UserOutlined,
} from "@ant-design/icons";
import { MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import api from "@/utils/apiHelper";
import VehicleMarker from "./components/VehicleMarker";
import TaxiMap from "./TaxiMap";
import TaxiSearchSheet from "./TaxiSearchSheet";
import DestinationPicker from "./DestinationPicker";
import { haversineKm } from "../shared/geo/haversine";
import { nominatimReverse as _nominatimReverse } from "../shared/geo/nominatim";
import { nominatimSearch as _nominatimSearch } from "../shared/geo/nominatim";
import AutoMarketAdsPanel from "./components/AutoMarketAdsPanel";
import { listMarketCars } from "../../../services/marketService.js";
import RatingModal from "@features/shared/components/RatingModal";
import ClientBonusWidget from "@/features/client/components/ClientBonusWidget";

// Backward-compatible signature (lat, lng, signal)
async function nominatimReverse(lat, lng, signal) {
  return _nominatimReverse(lat, lng, { signal });
}

// Backward-compatible signature (q, signal)
async function nominatimSearch(q, signal) {
  return _nominatimSearch(q, { signal });
}

/**
 * CLIENT TAXI (Yandex-Go like flow)
 *
 * Screens / flow:
 *  - "main": pickup selection by map center pin (yellow man icon), shows "Qaerga borasiz?" and "Buyurtma berish" (destination optional)
 *  - "search": destination search drawer, two fields: pickup and destination; pickup can be changed via map button
 *  - "dest_map": destination selection by map center pin; shows price bubble; bottom sheet auto-hides on dragging, shows when stop; has "Tayyor"
 *  - "route": route preview (A->B + optional waypoints), tariffs, "Buyurtma berish"
 *  - "searching": dispatch/searching nearby cars; show waves, cars, cancel
 *  - "coming": driver accepted; show real-time driver marker + ETA + details + actions
 *
 * Notes:
 *  - Distance > 50km: block dispatch/ordering (as requested)
 *  - Destination optional: user can order without selecting destination
 */

const { Text } = Typography;

const MAX_KM = 50;

const tileDay = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const tileNight = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

/** --- icons --- */
const pickupIcon = L.divIcon({
  className: "yg-pin",
  html: `
    <div class="yg-pin-wrap">
      <div class="yg-pin-top">
        <div class="yg-pin-yellow">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Z" fill="rgba(0,0,0,.75)"/>
            <path d="M4 22c0-4.42 3.58-8 8-8s8 3.58 8 8" stroke="rgba(0,0,0,.75)" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
      <div class="yg-pin-stem"></div>
      <div class="yg-pin-dot"></div>
    </div>
  `,
  iconSize: [44, 62],
  iconAnchor: [22, 54],
});

const destIcon = L.divIcon({
  className: "yg-dest",
  html: `
    <div class="yg-dest-wrap">
      <div class="yg-dest-top">
        <div class="yg-dest-flag">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M6 3v18" stroke="rgba(0,0,0,.75)" stroke-width="2" stroke-linecap="round"/>
            <path d="M6 4h11l-2 4 2 4H6" fill="rgba(0,0,0,.1)" stroke="rgba(0,0,0,.75)" stroke-width="2" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
      <div class="yg-pin-stem"></div>
      <div class="yg-pin-dot red"></div>
    </div>
  `,
  iconSize: [44, 62],
  iconAnchor: [22, 54],
});

/** --- utils --- */
function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}



async function nominatimSearch(q, signal) {
  // countrycodes=uz natijalarni faqat O'zbekiston bilan cheklaydi
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=7&addressdetails=1&q=${encodeURIComponent(
    q
  )}&countrycodes=uz`;
  try {
    const res = await fetch(url, { signal, headers: { "Accept-Language": "uz,ru,en" } });
    const data = await res.json();
    return (data || []).map((x) => ({
      id: x.place_id,
      label: x.display_name,
      lat: parseFloat(x.lat),
      lng: parseFloat(x.lon),
    }));
  } catch (e) {
    if (e?.name === "AbortError") return [];
    return [];
  }
}

// OSRM yo'nalish topa olmasa ham xato bermaslik uchun:
async function osrmRouteMulti(points /* [[lat,lng], ...] */) {
  if (!points || points.length < 2) return null;
  try {
    const pairs = points
      .filter(Boolean)
      .map((p) => `${p[1]},${p[0]}`)
      .join(";");
    const url = `https://router.project-osrm.org/route/v1/driving/${pairs}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    const r = data?.routes?.[0];
    if (r) {
      const coords = r.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      return {
        coords,
        distanceKm: (r.distance || 0) / 1000,
        durationMin: (r.duration || 0) / 60,
      };
    }
  } catch (e) {
    console.warn("OSRM yo'nalish chizishda xatolik:", e);
  }
  // Fallback: Agar yo'nalish chizib bo'lmasa, to'g'ri chiziq chizamiz
  const from = points[0];
  const to = points[points.length - 1];
  return {
    coords: [from, to],
    distanceKm: haversineKm(from, to),
    durationMin: haversineKm(from, to) * 2, // Taxminiy vaqt
  };
}

function money(n) {
  const x = Math.round(Number(n || 0));
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " so'm";
}

function useDebouncedReverse(when, latlng, delay = 350) {
  const [addr, setAddr] = useState("");
  const abortRef = useRef(null);
  const tRef = useRef(null);

  useEffect(() => {
    if (!when) return;
    if (!latlng) return;

    if (tRef.current) clearTimeout(tRef.current);
    if (abortRef.current) abortRef.current.abort();

    const ac = new AbortController();
    abortRef.current = ac;

    tRef.current = setTimeout(async () => {
      const a = await nominatimReverse(latlng[0], latlng[1], ac.signal);
      setAddr(a || "");
    }, delay);

    return () => {
      if (tRef.current) clearTimeout(tRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [when, latlng?.[0], latlng?.[1], delay]);

  return addr;
}

/** --- Map helpers --- */
function CenterWatcher({ onCenterChange, onMoveStart, onMoveEnd }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const fire = () => {
      const c = map.getCenter();
      onCenterChange?.([c.lat, c.lng], map.getZoom());
    };

    const ms = () => onMoveStart?.();
    const me = () => {
      onMoveEnd?.();
      fire();
    };

    map.on("movestart", ms);
    map.on("moveend", me);
    map.on("zoomend", me);

    // initial
    fire();

    return () => {
      map.off("movestart", ms);
      map.off("moveend", me);
      map.off("zoomend", me);
    };
  }, [map, onCenterChange, onMoveStart, onMoveEnd]);

  return null;
}

function LocateMeButton({ mapRef, userLoc, bottom = 240 }) {
  return (
    <div style={{ position: "absolute", right: 16, bottom, zIndex: 800 }}>
      <Button
        shape="circle"
        size="large"
        icon={<AimOutlined style={{ fontSize: 22 }} />}
        style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
        onClick={() => {
          const map = mapRef.current;
          // If we already have a location — just center the map
          if (map && userLoc) {
            map.flyTo(userLoc, 16, { duration: 0.6 });
            return;
          }
          // Otherwise request location now (user may have granted permission after initial load)
          if (!navigator.geolocation) {
            message.error("Geolokatsiya mavjud emas");
            return;
          }
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const ll = [pos.coords.latitude, pos.coords.longitude];
              setUserLoc(ll);
              // Keep pickup in sync with the real device location (does not change flow)
              setPickup((p) => ({ ...p, latlng: ll }));
              if (map) map.flyTo(ll, 16, { duration: 0.6 });
            },
            () => {
              message.error("Joylashuvni aniqlab bo‘lmadi");
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
          );
        }}
      />
    </div>
  );
}

/** --- local saved addresses --- */
/** --- my addresses (savedAddresses_v1) --- */
function loadMyAddressesV1() {
  try {
    const raw = localStorage.getItem("savedAddresses_v1");
    const arr = raw ? JSON.parse(raw) : [];
    if (Array.isArray(arr)) return arr;
  } catch {}
  return [];
}
function loadSavedPlaces() {
  try {
    const raw = localStorage.getItem("client_saved_places");
    const arr = raw ? JSON.parse(raw) : [];
    if (Array.isArray(arr)) return arr;
  } catch {}
  return [];
}

function savePlace(place) {
  const list = loadSavedPlaces();
  const exists = list.find((x) => x.id === place.id);
  const next = exists ? list.map((x) => (x.id === place.id ? place : x)) : [place, ...list].slice(0, 20);
  localStorage.setItem("client_saved_places", JSON.stringify(next));
  return next;
}

/** --- speech ("Alisa") --- */
function speak(text) {
  try {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ru-RU"; // closest to "Alisa"-like on many Android/Chrome setups
    u.rate = 1;
    u.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {}
}

/** --- main component --- */
export default function ClientTaxiPage() {
  const mapRef = useRef(null);
  const tariffSectionRef = useRef(null);
  const scrollTariffOnOpenRef = useRef(false);

  // theme
  const [darkMode, setDarkMode] = useState(false);

  // flow
  const [step, setStep] = useState("main"); // main | search | dest_map | route | searching | coming

  // --- mobile BACK handling: rely on phone back button, not UI back arrow ---
  const isPopNavRef = useRef(false);
  const stepRef = useRef(step);
  useEffect(() => { stepRef.current = step; }, [step]);

  useEffect(() => {
    // Push an entry for in-page flow steps so phone back button returns inside the flow first.
    // We avoid pushing for the initial mount.
    const st = { __taxiStep: step };
    if (!isPopNavRef.current) {
      try {
        window.history.pushState(st, "");
      } catch {}
    }
    isPopNavRef.current = false;
  }, [step]);

  useEffect(() => {
    const onPop = (e) => {
      // Mark this navigation as popstate-driven to avoid pushState loop
      isPopNavRef.current = true;

      const cur = stepRef.current;

      // Step back inside the taxi flow
      if (cur === "stop_map") { setStep("route"); return; }
      if (cur === "searching" || cur === "coming") { setStep("route"); return; }
      if (cur === "route") { setStep("main"); return; }
      if (cur === "dest_map") { setStep("search"); return; }
      if (cur === "search") { setStep("main"); return; }

      // If already at main — allow browser to go to previous page
      // (Do nothing here; browser will handle it naturally)
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const requestLocateNow = useCallback(() => {
    if (!navigator.geolocation) {
      message.error("Geolokatsiya mavjud emas");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const ll = [pos.coords.latitude, pos.coords.longitude];
        setUserLoc(ll);
        setPickup((p) => ({ ...p, latlng: ll }));
        const map = mapRef.current;
        if (map) map.flyTo(ll, 16, { duration: 0.6 });
      },
      () => {
        message.error("Joylashuvni aniqlab bo‘lmadi");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, []);
  const [loading, setLoading] = useState(false);

  // locations
  const [userLoc, setUserLoc] = useState(null); // [lat,lng]
  const [pickup, setPickup] = useState({ latlng: null, address: "", entrance: "" });
  const [dest, setDest] = useState({ latlng: null, address: "" });

  // waypoints (optional)
  const [waypoints, setWaypoints] = useState([]); // [{latlng,address}]
  const [addStopOpen, setAddStopOpen] = useState(false);

  // map center tracking for pickup/dest map screens
  const [centerLatLng, setCenterLatLng] = useState(null);
  const [isDraggingMap, setIsDraggingMap] = useState(false);

  // search drawer
  const [searchOpen, setSearchOpen] = useState(false);
  const [pickupSearchText, setPickupSearchText] = useState("");
  const [destSearchText, setDestSearchText] = useState("");
  const [pickupResults, setPickupResults] = useState([]);
  const [destResults, setDestResults] = useState([]);
  const [searchBusy, setSearchBusy] = useState(false);

  // suggestions -> pickup/destination setters (used by TaxiSearchSheet)
  const setPickupFromSuggestion = useCallback(
    (item) => {
      if (!item) return;
      const lat = item.lat ?? item.latitude ?? item?.location?.lat;
      const lng = item.lng ?? item.lon ?? item.longitude ?? item?.location?.lng;
      const address = item.address ?? item.title ?? item.name ?? "";
      if (lat != null && lng != null) {
        setPickup((p) => ({ ...p, latlng: [Number(lat), Number(lng)], address: address || p.address }));
      } else {
        setPickup((p) => ({ ...p, address: address || p.address }));
      }
      setPickupSearchText(address);
      setSearchOpen(false);
      // If destination already chosen, go to route preview
      if (dest?.latlng) setStep("route");
    },
    [dest?.latlng]
  );

  const setDestFromSuggestion = useCallback(
    (item) => {
      if (!item) return;
      const lat = item.lat ?? item.latitude ?? item?.location?.lat;
      const lng = item.lng ?? item.lon ?? item.longitude ?? item?.location?.lng;
      const address = item.address ?? item.title ?? item.name ?? "";
      if (lat != null && lng != null) {
        setDest((d) => ({ ...d, latlng: [Number(lat), Number(lng)], address: address || d.address }));
      } else {
        setDest((d) => ({ ...d, address: address || d.address }));
      }
      setDestSearchText(address);
      setSearchOpen(false);
      // If pickup already chosen, go to route preview
      if (pickup?.latlng) setStep("route");
    },
    [pickup?.latlng]
  );

  // saved places
  const [savedPlaces, setSavedPlaces] = useState([]);

  // my addresses (Uy/Ish) from MyAddresses page
  const [myAddressesV1, setMyAddressesV1] = useState(() => loadMyAddressesV1());
  const homeAddr = useMemo(() => myAddressesV1.find(x => String(x?.label || '').toLowerCase() === 'uy') || null, [myAddressesV1]);
  const workAddr = useMemo(() => myAddressesV1.find(x => String(x?.label || '').toLowerCase() === 'ish') || null, [myAddressesV1]);


  // route preview
  const [route, setRoute] = useState(null); // {coords, distanceKm, durationMin}
  const [tariff, setTariff] = useState({ id: "start", title: "Start", mult: 1, base: 4500, perKm: 1400 });
  const tariffs = useMemo(
    () => [
      { id: "start", title: "Start", mult: 1, base: 4500, perKm: 1400 },
      { id: "comfort", title: "Komfort", mult: 1.2, base: 6500, perKm: 1700 },
      { id: "business", title: "Biznes", mult: 1.5, base: 9000, perKm: 2200 },
    ],
    []
  );

  // order / driver
  const [orderId, setOrderId] = useState(null);
  const [orderStatus, setOrderStatus] = useState(null);
  const [assignedDriver, setAssignedDriver] = useState(null); // {first_name, car_model, plate, avatar_url, lat, lng, bearing, rating}
  // Reyting modal — safar yakunlangandan keyin ochiladi
  const [ratingVisible, setRatingVisible] = useState(false);
  const [completedOrderForRating, setCompletedOrderForRating] = useState(null);
  // Cashback bonus widget
  const [bonusVisible, setBonusVisible] = useState(false);
  const [earnedBonus, setEarnedBonus] = useState(0);
  const [etaMin, setEtaMin] = useState(null);

  // actions / modals
  const [podyezdOpen, setPodyezdOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // order extras
  const [orderFor, setOrderFor] = useState("self"); // 'self' | 'other'
  const [otherPhone, setOtherPhone] = useState("");
  const [wishesOpen, setWishesOpen] = useState(false);
  const [wishes, setWishes] = useState({
    ac: false,
    trunk: false,
    childSeat: false,
    smoking: "no", // 'no' | 'yes'
  });
  const [comment, setComment] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduledTime, setScheduledTime] = useState(null); // ISO string or null

  // shortcuts (Uy/Ish)
  const [shortcuts, setShortcuts] = useState({ home: null, work: null }); // {label,lat,lng}


  // live cars around when searching
  const [nearCars, setNearCars] = useState([]); // [{id,lat,lng,bearing}]
  const [dispatchLine, setDispatchLine] = useState(null); // [[lat,lng],[lat,lng]]
  const [dispatchIdx, setDispatchIdx] = useState(0);

  // address strings (debounced reverse-geocode)
  const pickupAddrFromCenter = useDebouncedReverse(step === "main" || step === "search", centerLatLng, 300);
  const destAddrFromCenter = useDebouncedReverse(step === "dest_map", centerLatLng, 300);
  // Update pickup address from map center while selecting pickup (main/search)
  useEffect(() => {
    if ((step === "main" || step === "search") && pickupAddrFromCenter) {
      setPickup((p) => ({ ...p, address: pickupAddrFromCenter, latlng: centerLatLng }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupAddrFromCenter, step]);

  // Update destination address from center while selecting destination on map
  useEffect(() => {
    if (step === "dest_map" && destAddrFromCenter) {
      setDest((d) => ({ ...d, address: destAddrFromCenter, latlng: centerLatLng }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destAddrFromCenter, step]);



  /** get user location */
  useEffect(() => {
    const saved = loadSavedPlaces();
    setSavedPlaces(saved);
    try {
      const sc = JSON.parse(localStorage.getItem('taxiShortcuts') || '{}');
      setShortcuts({ home: sc.home || null, work: sc.work || null });
    } catch {}

    let mounted = true;

    const ok = (pos) => {
      if (!mounted) return;
      const ll = [pos.coords.latitude, pos.coords.longitude];
      setUserLoc(ll);
      setPickup((p) => ({ ...p, latlng: ll }));
    };
    const fail = () => {
      // fallback Nukus center
      const ll = [42.4602, 59.6156];
      setUserLoc(ll);
      setPickup((p) => ({ ...p, latlng: ll }));
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(ok, fail, {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 2000,
      });
    } else {
      fail();
    }

    return () => {
      mounted = false;
    };
  }, []);

  /** keep pickup address synced from center pin in main/search (when user drags map) */
  useEffect(() => {
    if (!(step === "main" || step === "search")) return;
    if (!centerLatLng) return;

    // only update while in main/search; user can override via search list, but map move should update pickup
    setPickup((p) => ({ ...p, latlng: centerLatLng, address: pickupAddrFromCenter || p.address }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupAddrFromCenter]);

  /** keep dest address synced from center pin in dest_map */
  useEffect(() => {
    if (step !== "dest_map") return;
    if (!centerLatLng) return;
    setDest((d) => ({ ...d, latlng: centerLatLng, address: destAddrFromCenter || d.address }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destAddrFromCenter]);

  /** compute route when we have pickup + dest + waypoints and step route */
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (step !== "route" && step !== "coming") return;
      if (!pickup.latlng || !dest.latlng) {
        setRoute(null);
        return;
      }
      const pts = [pickup.latlng, ...waypoints.map((w) => w.latlng).filter(Boolean), dest.latlng];
      const r = await osrmRouteMulti(pts);
      if (!cancelled) setRoute(r);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [step, pickup.latlng?.[0], pickup.latlng?.[1], dest.latlng?.[0], dest.latlng?.[1], waypoints.length]);

  const distanceKm = useMemo(() => route?.distanceKm || (pickup.latlng && dest.latlng ? haversineKm(pickup.latlng, dest.latlng) : 0), [
    route?.distanceKm,
    pickup.latlng,
    dest.latlng,
  ]);
  const durationMin = useMemo(() => route?.durationMin || (distanceKm ? distanceKm * 2 : 0), [route?.durationMin, distanceKm]);

  const totalPrice = useMemo(() => {
    const d = distanceKm || 0;
    const p = (tariff.base + d * tariff.perKm) * (tariff.mult || 1);
    return Math.round(p);
  }, [distanceKm, tariff]);

  /** search drawer: fetch results (debounced + abortable) */
  const pickupAbortRef = useRef(null);
  const destAbortRef = useRef(null);

  useEffect(() => {
    if (!searchOpen) return;

    const t = setTimeout(async () => {
      const q = pickupSearchText.trim();
      if (!q) {
        setPickupResults([]);
        return;
      }
      if (pickupAbortRef.current) pickupAbortRef.current.abort();
      const ac = new AbortController();
      pickupAbortRef.current = ac;
      setSearchBusy(true);
      const res = await nominatimSearch(q, ac.signal);
      setPickupResults(res);
      setSearchBusy(false);
    }, 250);

    return () => clearTimeout(t);
  }, [pickupSearchText, searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;

    const t = setTimeout(async () => {
      const q = destSearchText.trim();
      if (!q) {
        setDestResults([]);
        return;
      }
      if (destAbortRef.current) destAbortRef.current.abort();
      const ac = new AbortController();
      destAbortRef.current = ac;
      setSearchBusy(true);
      const res = await nominatimSearch(q, ac.signal);
      setDestResults(res);
      setSearchBusy(false);
    }, 250);

    return () => clearTimeout(t);
  }, [destSearchText, searchOpen]);

  /** open destination search */
  const openDestinationSearch = useCallback(() => {
    setSearchOpen(true);
    setStep("search");
    setPickupSearchText(pickup.address || "");
    setDestSearchText(dest.address || "");
  }, [pickup.address, dest.address]);

  /** select pickup from search */
  const choosePickup = useCallback(
    (item) => {
      if (!item) return;
      setPickup({ latlng: [item.lat, item.lng], address: item.label, entrance: "" });
      const map = mapRef.current;
      if (map) map.flyTo([item.lat, item.lng], 16, { duration: 0.6 });
      setSearchOpen(false);
      setStep("main");
    },
    []
  );

  /** select destination from search -> go route (or dest_map if user wants map) */
  const chooseDestination = useCallback(
    (item) => {
      if (!item) return;
      setDest({ latlng: [item.lat, item.lng], address: item.label });
      // save to "my addresses"
      setSavedPlaces(savePlace({ id: String(item.id || Date.now()), title: item.label, lat: item.lat, lng: item.lng, type: "recent" }));
      setSearchOpen(false);
      setStep("route");
    },
    []
  );

  /** open pickup map edit (for "Yo'lovchini olish" field) */
  const openPickupMapEdit = useCallback(() => {
    setStep("main");
    setSearchOpen(false);
    // center pin already pickup; user drags to adjust
    message.info("Xaritani siljitib yo'lovchini olish nuqtasini o'zgartiring");
  }, []);

  /** open dest map edit */
  const openDestMapEdit = useCallback(() => {
    setStep("dest_map");
    setSearchOpen(false);
    // fly to destination or pickup
    const map = mapRef.current;
    if (map) {
      const c = dest.latlng || pickup.latlng || userLoc;
      if (c) map.flyTo(c, 16, { duration: 0.6 });
    }
  }, [dest.latlng, pickup.latlng, userLoc]);

  /** backward-compat: TaxiSearchSheet expects openDestMapSelect */
  const openDestMapSelect = openDestMapEdit;

  /** open share ride modal (backward-compat) */
  const openShareRide = useCallback(() => {
    setShareOpen(true);
  }, []);



  /** add stop (waypoint) */
  const addStopFromCenter = useCallback(() => {
    if (!centerLatLng) return;
    const addr = step === "dest_map" ? (destAddrFromCenter || "") : (pickupAddrFromCenter || "");
    const stop = { latlng: centerLatLng, address: addr || "Oraliq bekat" };
    setWaypoints((w) => [...w, stop].slice(0, 3));
    setAddStopOpen(false);
    message.success("Oraliq bekat qo'shildi");
  }, [centerLatLng, step, destAddrFromCenter, pickupAddrFromCenter]);

  // Select destination from a plain address string (Uy/Ish from "Mening manzillarim")
  const applyDestinationFromAddressString = useCallback(
    async (addressStr) => {
      const q = String(addressStr || "").trim();
      if (!q) return;
      try {
        const results = await nominatimSearch(q);
        const first = Array.isArray(results) ? results[0] : null;
        if (!first) {
          message.error("Manzil topilmadi");
          return;
        }
        const ll = [Number(first.lat), Number(first.lon)];
        const addr = first.display_name || q;
        setDest({ latlng: ll, address: addr });
        setSearchQuery(addr);
        setSearchOpen(false);
        // Keep pickup, then show route preview
        if (pickup?.latlng) setStep("route");
        else setStep("main");
      } catch (e) {
        message.error("Manzilni aniqlab bo‘lmadi");
      }
    },
    [pickup?.latlng]
  );


  /** order create (destination optional) */
  const handleOrderCreate = useCallback(async () => {
    if (!pickup.latlng) {
      message.error("Yo'lovchini olish nuqtasi aniqlanmadi");
      return;
    }

    // distance check only if destination exists
    if (dest.latlng) {
      const d = distanceKm || haversineKm(pickup.latlng, dest.latlng);
      if (d > MAX_KM) {
        message.error(`Masofa belgilangan me'yoridan ortiq (${MAX_KM} km)`);
        return;
      }
    }

    const hide = message.loading("Buyurtma yuborilmoqda...", 0);

    try {
      const payloadBase = {
        status: "searching",
        price: Math.round(totalPrice),
        service_type: tariff.id,
        pickup_location: pickup.address || "Yo'lovchini olish nuqtasi",
        dropoff_location: dest.address || "",
        from_lat: pickup.latlng[0],
        from_lng: pickup.latlng[1],
        to_lat: dest.latlng ? dest.latlng[0] : null,
        to_lng: dest.latlng ? dest.latlng[1] : null,
        distance_km: dest.latlng ? (distanceKm || haversineKm(pickup.latlng, dest.latlng)) : 0,
        waypoints: waypoints.map((w) => ({
          lat: w.latlng?.[0],
          lng: w.latlng?.[1],
          address: w.address || "",
        })),
        pickup_entrance: pickup.entrance || "",
        order_for: orderFor,
        other_phone: orderFor === "other" ? (otherPhone || "") : "",
        wishes: wishes,
        comment: comment || "",
        scheduled_time: scheduledTime,
      };

      // Backend mismatch safety: try a few actions
      const actions = ["create", "create_taxi", "create_city", "new"];
      let res = null;
      let lastErr = null;

      for (const action of actions) {
        try {
          // eslint-disable-next-line no-await-in-loop
          res = await api.post("/api/order", { action, ...payloadBase });
          if (res?.data || res?.id || res?.orderId) break;
        } catch (e) {
          lastErr = e;
        }
      }

      const id = res?.data?.id || res?.id || res?.orderId;
      if (!id) throw lastErr || new Error("Serverdan ID kelmadi");

      setOrderId(String(id));
      localStorage.setItem("activeOrderId", String(id));
      setOrderStatus("searching");
      setStep("searching");
      speak("Haydovchi qidirilmoqda");
      message.success("Buyurtma yuborildi");
    } catch (e) {
      console.error("Order error:", e);
      message.error("Zakaz berishda xatolik: " + (e?.message || "Server bilan aloqa yo'q"));
    } finally {
      hide();
    }
  }, [pickup, dest, tariff, totalPrice, distanceKm, waypoints]);

  /** cancel order */
  const handleCancel = useCallback(async () => {
    if (!orderId) {
      setStep("main");
      setOrderStatus(null);
      return;
    }
    const hide = message.loading("Bekor qilinmoqda...", 0);
    try {
      await api.post("/api/order", { action: "cancel", order_id: orderId });
    } catch (e) {
      console.warn(e);
    } finally {
      hide();
      localStorage.removeItem("activeOrderId");
      setOrderId(null);
      setOrderStatus(null);
      setAssignedDriver(null);
      setNearCars([]);
      setDispatchLine(null);
      setStep("main");
      speak("Safar bekor qilindi");
    }
  }, [orderId]);

  /** polling active order on reload */
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const saved = localStorage.getItem("activeOrderId");
        if (saved) setOrderId(saved);

        const res = await api.post("/api/order", { action: "active" });
        const o = res?.data || res;
        if (!mounted) return;
        if (o?.id) {
          setOrderId(String(o.id));
          localStorage.setItem("activeOrderId", String(o.id));
          setOrderStatus(o.status || o.order_status || "searching");
          setPickup((p) => ({
            ...p,
            latlng: o.from_lat && o.from_lng ? [Number(o.from_lat), Number(o.from_lng)] : p.latlng,
            address: o.pickup_location || p.address,
          }));
          if (o.to_lat && o.to_lng) {
            setDest({ latlng: [Number(o.to_lat), Number(o.to_lng)], address: o.dropoff_location || "" });
          }
          if (o.status === "accepted" || o.status === "coming" || o.status === "arrived") {
            setStep("coming");
          } else if (o.status === "searching") {
            setStep("searching");
          } else {
            setStep("main");
          }
        }
      } catch (e) {
        // ignore
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, []);

  /** polling order status + driver info */
  useEffect(() => {
    if (!orderId) return;

    let timer = null;
    let alive = true;

    const tick = async () => {
      try {
        const res = await api.post("/api/order", { action: "get", order_id: orderId });
        if (!alive) return;
        const o = res?.data || res;
        const st = o?.status || o?.order_status;
        if (st && st !== orderStatus) {
          setOrderStatus(st);
          if (st === "accepted") speak("Haydovchi topildi");
          if (st === "arrived") speak("Haydovchi yetib keldi");
          // Safar yakunlandi — reyting modalini ochish
          if (st === "completed" || st === "done") {
            speak("Safar yakunlandi. Rahmat!");
            const drvId = o?.driver?.id || o?.driver_id || o?.assigned_driver_id || null;
            const clientId = o?.client_user_id || o?.user_id || null;
            setCompletedOrderForRating({
              id: orderId,
              driver_id: drvId,
              client_user_id: clientId,
            });
            setRatingVisible(true);
            // Cashback hisoblash: narxning 1%i
            const price = Number(o?.price || o?.amount || o?.priceUzs || 0);
            setEarnedBonus(Math.max(1, Math.floor(price * 0.01)));
          }
        }

        const drv = o?.driver || o?.assigned_driver || o?.assignedDriver;
        if (drv) {
          setAssignedDriver({
            first_name: drv.first_name || drv.name || "Haydovchi",
            avatar_url: drv.avatar_url || drv.avatar || "",
            car_model: drv.car_model || drv.car || "",
            plate: drv.plate || drv.car_plate || "",
            lat: Number(drv.lat ?? drv.driver_lat ?? drv.latitude),
            lng: Number(drv.lng ?? drv.driver_lng ?? drv.longitude),
            bearing: Number(drv.bearing ?? drv.heading ?? 0),
            rating: Number(drv.rating ?? 4.8),
            phone: drv.phone || "",
          });
        }

        // ETA calc
        if (assignedDriver?.lat && assignedDriver?.lng && pickup.latlng) {
          const d = haversineKm([assignedDriver.lat, assignedDriver.lng], pickup.latlng);
          setEtaMin(Math.max(1, Math.round(d * 3)));
        }
      } catch (e) {
        // ignore
      }
    };

    tick();
    const nextInterval = () => {
      // Polling interval strategy to avoid heating the phone
      // searching: 2s, driver found: 3.5s, trip: 8s
      if (step === "searching" || orderStatus === "searching") return 2000;
      if (orderStatus === "accepted" || orderStatus === "coming" || orderStatus === "arrived") return 3500;
      if (orderStatus === "ontrip" || orderStatus === "in_trip") return 8000;
      return 4000;
    };

    let stopped = false;
    const loop = async () => {
      if (stopped) return;
      await tick();
      if (stopped) return;
      timer = setTimeout(loop, nextInterval());
    };

    loop();

    return () => {
      alive = false;
      stopped = true;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, pickup.latlng?.[0], pickup.latlng?.[1], orderStatus, step]);

  /** searching state: simulate nearby cars + dispatch cycling (visual only, backend dispatch can be added later) */
  useEffect(() => {
    if (step !== "searching") return;
    if (!pickup.latlng) return;

    // create fake cars around pickup if backend not returning
    const baseLat = pickup.latlng[0];
    const baseLng = pickup.latlng[1];

    const cars = Array.from({ length: 6 }).map((_, i) => {
      const ang = (i / 6) * Math.PI * 2;
      const r = 0.006 + Math.random() * 0.01;
      return {
        id: "c" + i,
        lat: baseLat + Math.cos(ang) * r,
        lng: baseLng + Math.sin(ang) * r,
        bearing: Math.random() * 360,
      };
    });

    setNearCars(cars);
    setDispatchIdx(0);

    let t = null;
    t = setInterval(() => {
      setDispatchIdx((x) => (x + 1) % cars.length);
    }, 1800);

    return () => {
      if (t) clearInterval(t);
    };
  }, [step, pickup.latlng]);

  useEffect(() => {
    if (step !== "searching") return;
    if (!pickup.latlng) return;
    if (!nearCars.length) return;
    const c = nearCars[dispatchIdx];
    if (!c) return;
    setDispatchLine([[c.lat, c.lng], pickup.latlng]);
  }, [step, dispatchIdx, nearCars, pickup.latlng]);

  /** fly to driver when coming */
  useEffect(() => {
    if (step !== "coming") return;
    const map = mapRef.current;
    if (!map) return;
    if (assignedDriver?.lat && assignedDriver?.lng) {
      map.flyTo([assignedDriver.lat, assignedDriver.lng], clamp(map.getZoom() || 15, 14, 17), { duration: 0.6 });
    }
  }, [step, assignedDriver?.lat, assignedDriver?.lng]);

  /** share link */
  const shareLink = useMemo(() => {
    if (!orderId) return "";
    try {
      const origin = window.location.origin;
      return `${origin}/share/${orderId}`;
    } catch {
      return "";
    }
  }, [orderId]);

  /** UI: bottom sheet auto-hide while dragging (dest_map) */
  const showSheet = useMemo(() => {
    if (step === "dest_map") return !isDraggingMap;
    return true;
  }, [step, isDraggingMap]);

  /** open "my addresses" selection (from main screen) */
  const handlePickSaved = useCallback(
    (p) => {
      if (!p) return;
      setDest({ latlng: [Number(p.lat), Number(p.lng)], address: p.label || p.name || "" });
      setStep("route");
    },
    []
  );

  /** create/update podyezd */
  const updateEntrance = useCallback((val) => {
    setPickup((p) => ({ ...p, entrance: val }));
  }, []);

  /** final route screen: allow "Belgilangan nuqta -> o'zgartirish" */
  const changeDestination = useCallback(() => {
    setStep("dest_map");
  }, []);

  const headerRight = (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <Switch
        checked={darkMode}
        onChange={(v) => setDarkMode(v)}
        checkedChildren="🌙"
        unCheckedChildren="☀️"
      />
    </div>
  );

  /** map tile URL */
  const mapTile = darkMode ? tileNight : tileDay;

  /** render header */
  const Header = (
    <div className="yg-header">
      <div style={{ width: 40, height: 40 }} />
      {/* back button removed: use phone back */}
      {/*
      <Button
        shape="circle"
        icon={<ArrowLeftOutlined />}
        onClick={() => {
          if (step === "search") {
            setSearchOpen(false);
            setStep("main");
            return;
          }
          if (step === "dest_map") {
            setStep("search");
            setSearchOpen(true);
            return;
          }
          if (step === "route") {
            setStep("main");
            return;
          }
          if (step === "searching" || step === "coming") {
            // do nothing (user can cancel)
            return;
          }
        }}
      />
      <div style={{ flex: 1 }} />
      {headerRight}
    </div>
  );

  /** --- main UI pieces --- */

  const PickupSummaryRow = (
    <div className="yg-field">
      <div className="yg-field-icon">
        <EnvironmentOutlined />
      </div>
      <div className="yg-field-body">
        <div className="yg-field-label">Yo‘lovchini olish nuqtasi</div>
        <div className="yg-field-value">{pickup.address || "Manzilingiz aniqlanmoqda..."}</div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Button size="small" className="yg-chip" onClick={openPickupMapEdit}>
          Xarita
        </Button>
        <Button size="small" className="yg-chip" onClick={() => setPodyezdOpen(true)}>
          Podyezd
        </Button>
      </div>
    </div>
  );

  const DestSummaryRow = (
    <div className="yg-field">
      <div className="yg-field-icon">
        <FlagOutlined />
      </div>
      <div className="yg-field-body">
        <div className="yg-field-label">Yakuniy manzil</div>
        <div className="yg-field-value">{dest.address || "Qaerga borasiz?"}</div>
      </div>
      <Button size="small" className="yg-chip" onClick={openDestinationSearch}>
        {dest.address ? "O'zgartirish" : "Qidirish"}
      </Button>
    </div>
  );

  /** --- bottom sheets --- */

  const MainSheet = (
    <div className="yg-sheet">
      <div className="yg-sheet-title">
        <div className="yg-logo" />
        <div style={{ fontSize: 30, fontWeight: 800 }}>Taksi</div>
      </div>

      <Button className="yg-long" onClick={openDestinationSearch}>
        Qaerga borasiz?
        <span className="yg-long-right">›</span>
      </Button>

      {/* Current pickup address line (requested) */}
      <div style={{ marginTop: 12 }}>
        {PickupSummaryRow}
      </div>

      {/* My saved addresses */}
      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Mening manzillarim</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <Button
            icon={<HomeOutlined />}
            style={{ flex: 1, borderRadius: 12 }}
            disabled={!homeAddr}
            onClick={() => applyDestinationFromAddressString(homeAddr?.address)}
          >
            Uy
          </Button>
          <Button
            icon={<BankOutlined />}
            style={{ flex: 1, borderRadius: 12 }}
            disabled={!workAddr}
            onClick={() => applyDestinationFromAddressString(workAddr?.address)}
          >
            Ish
          </Button>
        </div>
        {savedPlaces.length === 0 ? (
          <div style={{ fontSize: 12, opacity: 0.55, padding: "8px 0" }}>Hozircha saqlangan manzil yo‘q</div>
        ) : (
          <div className="yg-saved">
            {savedPlaces.slice(0, 4).map((p) => (
              <button key={p.id || p.place_id || `${p.lat},${p.lng}`} className="yg-saved-item" onClick={() => handlePickSaved(p)}>
                <div className="yg-saved-ic">📍</div>
                <div className="yg-saved-txt">
                  <div className="yg-saved-title">{p.name || p.title || 'Manzil'}</div>
                  <div className="yg-saved-sub">{p.label || ''}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Buyurtma berish without destination */}
      <div className="yg-bottom-row">
        <Button className="yg-blue" type="primary" onClick={handleOrderCreate}>
          Buyurtma berish
        </Button>
        <Button className="yg-round" icon={<CarOutlined />} onClick={() => {
            // Open tariff selector (scroll to tariffs section)
            if (step !== "route") {
              scrollTariffOnOpenRef.current = true;
              setStep("route");
              return;
            }
            try { tariffSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); } catch {}
          }} />
      </div>
    </div>
  );

  // TaxiSearchSheet komponenti bitta list ko'rinishida qabul qiladi.
  // Bizda esa pickup/destination uchun alohida natijalar bor.
  // Qaysi input to'ldirilgan bo'lsa, o'sha natijani ko'rsatamiz.
  const searchLoading = searchBusy;
  const searchResults = useMemo(() => {
    const qDest = (destSearchText || "").trim();
    if (qDest) return destResults;
    return pickupResults;
  }, [destSearchText, destResults, pickupResults]);

  const SearchDrawer = (
    <TaxiSearchSheet
      pickupAddress={pickup.address}
      searchOpen={searchOpen}
      setSearchOpen={setSearchOpen}
      setStep={setStep}
      pickupSearchText={pickupSearchText}
      setPickupSearchText={setPickupSearchText}
      destSearchText={destSearchText}
      setDestSearchText={setDestSearchText}
      searchLoading={searchLoading}
      searchResults={searchResults}
      savedPlaces={savedPlaces}
      setDestFromSuggestion={setDestFromSuggestion}
      setPickupFromSuggestion={setPickupFromSuggestion}
      openPickupMapEdit={openPickupMapEdit}
      openDestMapSelect={openDestMapSelect}
      openShareRide={openShareRide}
    />
  );

  const DestMapSheet = (
    <DestinationPicker
      showSheet={showSheet}
      dest={dest}
      pickup={pickup}
      totalPrice={totalPrice}
      money={money}
      haversineKm={haversineKm}
      MAX_KM={MAX_KM}
      message={message}
      onConfirm={() => {
        setStep("route");
        setSearchOpen(false);
      }}
    />
  );

  
  useEffect(() => {
    if (step === "route" && scrollTariffOnOpenRef.current) {
      scrollTariffOnOpenRef.current = false;
      setTimeout(() => {
        try { tariffSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); } catch {}
      }, 50);
    }
  }, [step]);

const RouteSheet = (
    <div className="yg-sheet">
      <div className="yg-route-top">
        <div className="yg-route-row">
          <div className="yg-field-icon"><EnvironmentOutlined /></div>
          <div className="yg-route-txt">
            <div className="yg-field-label">Ketish nuqtasi</div>
            <div className="yg-field-value">{pickup.address || "—"}</div>
          </div>
          <Button size="small" className="yg-chip" onClick={openDestinationSearch}>
            {dest.address ? "Podyezd" : "Xarita"}
          </Button>
        </div>

        <div className="yg-route-row">
          <div className="yg-field-icon"><FlagOutlined /></div>
          <div className="yg-route-txt">
            <div className="yg-field-label">Borish nuqtasi</div>
            <div className="yg-field-value">{dest.address || "Belgilanmagan"}</div>
          </div>
          <Button size="small" className="yg-chip" onClick={changeDestination}>
            O‘zgartirish
          </Button>
        </div>

        {/* waypoints */}
        <div style={{ marginTop: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Oraliq bekatlar</div>
            <Button
              size="small"
              icon={<PlusOutlined />}
              className="yg-chip"
              onClick={() => { setAddStopOpen(true); setStep('stop_map'); }}
              disabled={waypoints.length >= 3}
            >
              +
            </Button>
          </div>
          {waypoints.length === 0 ? (
            <div style={{ fontSize: 12, opacity: 0.55, marginTop: 4 }}>Hozircha yo‘q</div>
          ) : (
            <div style={{ marginTop: 6 }}>
              {waypoints.map((w, idx) => (
                <div key={idx} className="yg-stop">
                  <div className="yg-stop-dot" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 650 }}>Bekat {idx + 1}</div>
                    <div className="yg-stop-addr">{w.address || "—"}</div>
                  </div>
                  <Button
                    size="small"
                    icon={<CloseOutlined />}
                    className="yg-chip"
                    onClick={() => setWaypoints((arr) => arr.filter((_, i) => i !== idx))}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <Divider style={{ margin: "12px 0" }} />

        {/* header actions */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
          <Button
            size="small"
            style={{ borderRadius: 999 }}
            icon={<ShareAltOutlined />}
            onClick={() => {
              const p = pickup?.latlng;
              const d = dest?.latlng;
              if (!p || !d) { message.info("Manzil tanlang"); return; }
              const url = `https://www.google.com/maps/dir/?api=1&origin=${p[0]},${p[1]}&destination=${d[0]},${d[1]}`;
              window.open(url, "_blank", "noopener,noreferrer");
            }}
          >
            Navigator
          </Button>
          <div className="yg-tab">Yetkazish xizmati</div>
        </div>

        <div className="yg-tariffs">
          {tariffs.map((t) => (
            <button
              key={t.id}
              className={"yg-tariff " + (tariff.id === t.id ? "active" : "")}
              onClick={() => setTariff(t)}
            >
              <div style={{ fontSize: 11, opacity: 0.7 }}>{Math.max(1, Math.round(durationMin))} daq</div>
              <div style={{ fontWeight: 800, marginTop: 2 }}>{t.title}</div>
              <div style={{ fontWeight: 800, marginTop: 2 }}>{money((t.base + (distanceKm || 0) * t.perKm) * t.mult)}</div>
            </button>
          ))}
        </div>

        
        {/* Kim uchun buyurtma? */}
        <div style={{ marginTop: 14, background: "rgba(255,255,255,0.85)", borderRadius: 14, padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontWeight: 800 }}>Kim uchun buyurtma?</div>
            <Segmented
              size="small"
              value={orderFor}
              options={[
                { label: "O‘zimga", value: "self" },
                { label: "Boshqaga", value: "other" },
              ]}
              onChange={(v) => setOrderFor(v)}
            />
          </div>
          {orderFor === "other" && (
            <Input
              prefix={<PhoneOutlined />}
              value={otherPhone}
              onChange={(e) => setOtherPhone(e.target.value)}
              placeholder="U odamning telefon raqami"
            />
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            {/* "Istaklar" removed — keep only schedule and "kim uchun" */}
            <Button
              icon={<ClockCircleOutlined />}
              onClick={() => setScheduleOpen(true)}
              style={{ flex: 1, borderRadius: 12 }}
            >
              Rejalash
            </Button>
          </div>

          {(comment || wishes.ac || wishes.trunk || wishes.childSeat || wishes.smoking === "yes" || scheduledTime) && (
            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
              {scheduledTime ? <>🕒 {new Date(scheduledTime).toLocaleString()}</> : null}
              {comment ? <div style={{ marginTop: 4 }}>📒 {comment}</div> : null}
            </div>
          )}
        </div>

        <div className="yg-bottom-row" style={{ marginTop: 14 }}>
          <Button className="yg-yellow" type="primary" onClick={handleOrderCreate}>
            Buyurtma berish
          </Button>
          <Button className="yg-round" icon={<ShareAltOutlined />} onClick={() => setShareOpen(true)} />
        </div>
      </div>
    </div>
  );

  const SearchingSheet = (
    <div className="yg-sheet">
      <div style={{ fontSize: 22, fontWeight: 900 }}>Yaqin-atrofda mos...</div>
      <div style={{ opacity: 0.7, marginTop: 2 }}>Moslarini qidiryapmiz</div>

      <div className="yg-bottom-row" style={{ marginTop: 14 }}>
        <Button className="yg-gray" icon={<CloseOutlined />} onClick={handleCancel}>
          Safarni bekor qilish
        </Button>
        <Button className="yg-gray" onClick={() => message.info("Tafsilotlar keyin qo'shiladi")}>
          Tafsilotlar
        </Button>
      </div>

      <div style={{ marginTop: 14 }}>
        <AutoMarketAdsPanel
          title="Avto savdo e’lonlari"
          mode="waiting"
          onOpenAd={(id) => navigate(`/auto-market/ad/${id}`)}
          fetchAds={listMarketCars}
        />
      </div>
    </div>
  );

  const ComingSheet = (
    <div className="yg-sheet">
      <div style={{ fontSize: 26, fontWeight: 900 }}>
        {etaMin ? `~${etaMin} daq va keladi` : "Haydovchi yo'lda"}
      </div>

      <div className="yg-driver-card">
        <div className="yg-driver-top">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 16, fontWeight: 900 }}>
              Haydovchi <span style={{ marginLeft: 6 }}><StarFilled style={{ color: "#faad14" }} /> {assignedDriver?.rating?.toFixed?.(2) || "4.80"}</span>
            </div>
          </div>
          <div style={{ opacity: 0.75 }}>{assignedDriver?.car_model || "Oq Chevrolet"}</div>
        </div>

        <div className="yg-plate-row">
          <div className="yg-plate">{assignedDriver?.plate || "—"}</div>
          <Avatar size={44} src={assignedDriver?.avatar_url} icon={<UserOutlined />} />
        </div>

        <div className="yg-actions">
          <Button className="yg-act">Aloqa</Button>
          <Button className="yg-act">Xavfsizlik</Button>
          <Button className="yg-act">Ulashish</Button>
        </div>
      </div>

      <div className="yg-field" style={{ marginTop: 10 }}>
        <div className="yg-field-icon"><EnvironmentOutlined /></div>
        <div className="yg-field-body">
          <div className="yg-field-label">Mijozni olish</div>
          <div className="yg-field-value">{pickup.address || "—"}</div>
        </div>
        <Button size="small" className="yg-chip" onClick={() => setShareOpen(true)}>Ulashish</Button>
      </div>

      <Divider style={{ margin: "12px 0" }} />

      <AutoMarketAdsPanel
        title="Avto savdo e’lonlari"
        mode="waiting"
        onOpenAd={(id) => navigate(`/auto-market/ad/${id}`)}
        fetchAds={listMarketCars}
      />

      <div className="yg-cancel-link" onClick={handleCancel}>
        Safarni bekor qilish
      </div>
    </div>
  );

  /** map overlays */
  const CenterPinOverlay = (
    <div className={"yg-center-pin " + (isDraggingMap ? "lift" : "")}>
      {/* empty: actual pin marker is placed by a real leaflet Marker at centerLatLng */}
    </div>
  );

  /** oraliq bekat tanlash overlay (Modal emas — z-index muammosini yo‘q qiladi) */
  const StopPickerOverlay = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2500,
        display: step === "stop_map" && addStopOpen ? "flex" : "none",
        flexDirection: "column",
        justifyContent: "flex-end",
        background: "rgba(0,0,0,0.15)",
      }}
      onClick={() => {
        // tap outside closes
        setAddStopOpen(false);
        setStep("route");
      }}
    >
      <div
        style={{
          background: "#fff",
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          padding: 14,
          boxShadow: "0 -8px 30px rgba(0,0,0,0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 6 }}>Oraliq bekat qo‘shish</div>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 10 }}>
          Xaritani kerakli joyga olib boring, so‘ng “Qo‘shish”ni bosing.
        </div>
        <div className="yg-small-box" style={{ marginBottom: 12 }}>
          {(destAddrFromCenter || pickupAddrFromCenter) || "Manzil aniqlanmoqda..."}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button
            style={{ flex: 1, borderRadius: 12 }}
            onClick={() => {
              setAddStopOpen(false);
              setStep("route");
            }}
          >
            Bekor
          </Button>
          <Button
            type="primary"
            style={{ flex: 1, borderRadius: 12, background: "#000", borderColor: "#000" }}
            onClick={() => {
              addStopFromCenter();
              setStep("route");
            }}
          >
            Qo‘shish
          </Button>
        </div>
      </div>
    </div>
  );

  /** add-stop modal (eski) — endi ishlatilmaydi, lekin kod saqlangan */
  const AddStopModal = null;

/** podyezd modal */
  const PodyezdModal = (
    <Modal
      open={podyezdOpen}
      onCancel={() => setPodyezdOpen(false)}
      onOk={() => setPodyezdOpen(false)}
      okText="Saqlash"
      cancelText="Bekor"
      title="Podyezd (kirish joyi)"
    >
      <Input
        value={pickup.entrance}
        onChange={(e) => updateEntrance(e.target.value)}
        placeholder="Masalan: 2"
        maxLength={8}
      />
      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
        Podyezd haydovchiga aniq eshik tagiga kelish uchun ko‘rsatiladi.
      </div>
    </Modal>
  );

  
  /** wishes (pozhelaniya) modal */
  const WishesModal = (
    <Modal
      open={wishesOpen}
      onCancel={() => setWishesOpen(false)}
      onOk={() => setWishesOpen(false)}
      okText="Tayyor"
      cancelText="Bekor"
      title="Istaklar (Pozhelaniya)"
    >
      <div style={{ display: "grid", gap: 10 }}>
        <Checkbox checked={!!wishes.ac} onChange={(e) => setWishes((w) => ({ ...w, ac: e.target.checked }))}>
          ❄️ Konditsioner kerak
        </Checkbox>
        <Checkbox checked={!!wishes.trunk} onChange={(e) => setWishes((w) => ({ ...w, trunk: e.target.checked }))}>
          🧳 Yukxona (bagaj) bo‘sh bo‘lsin
        </Checkbox>
        <Checkbox
          checked={!!wishes.childSeat}
          onChange={(e) => setWishes((w) => ({ ...w, childSeat: e.target.checked }))}
        >
          👶 Bolalar o‘rindig‘i (kreslo)
        </Checkbox>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 140, opacity: 0.75 }}>🚬 Chekish</div>
          <Segmented
            options={[
              { label: "Mumkin emas", value: "no" },
              { label: "Mumkin", value: "yes" },
            ]}
            value={wishes.smoking}
            onChange={(v) => setWishes((w) => ({ ...w, smoking: v }))}
          />
        </div>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>📒 Izoh</div>
          <Input.TextArea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Masalan: Podyezd orqada, shlagbaum kodi: 1234..."
            autoSize={{ minRows: 3, maxRows: 6 }}
          />
        </div>
      </div>
    </Modal>
  );

  /** schedule modal */
  const ScheduleModal = (
    <Modal
      open={scheduleOpen}
      onCancel={() => setScheduleOpen(false)}
      onOk={() => setScheduleOpen(false)}
      okText="Tayyor"
      cancelText="Bekor"
      title="Oldindan buyurtma (Zaplanirovat)"
    >
      <div style={{ display: "grid", gap: 10 }}>
        <Segmented
          options={[
            { label: "Hozir", value: "now" },
            { label: "Vaqtni tanlash", value: "pick" },
          ]}
          value={scheduledTime ? "pick" : "now"}
          onChange={(v) => {
            if (v === "now") setScheduledTime(null);
            if (v === "pick" && !scheduledTime) setScheduledTime(new Date(Date.now() + 15 * 60 * 1000).toISOString());
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ClockCircleOutlined />
          <Input
            type="datetime-local"
            value={scheduledTime ? new Date(scheduledTime).toISOString().slice(0, 16) : ""}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return setScheduledTime(null);
              try {
                setScheduledTime(new Date(v).toISOString());
              } catch {
                setScheduledTime(null);
              }
            }}
          />
        </div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Agar vaqt tanlansa, serverga <b>scheduled_time</b> sifatida yuboriladi.
        </div>
      </div>
    </Modal>
  );

/** share modal */
  const ShareModal = (
    <Modal open={shareOpen} onCancel={() => setShareOpen(false)} footer={null} title="Buyurtmani ulashish">
      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
        Havolani do‘stingizga yuboring. U sizning holatingizni ko‘ra oladi.
      </div>
      <Input value={shareLink} readOnly />
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <Button
          type="primary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(shareLink);
              message.success("Nusxa olindi");
            } catch {
              message.info("Nusxa olish uchun brauzer ruxsat bermadi");
            }
          }}
        >
          Nusxa olish
        </Button>
        <Button onClick={() => setShareOpen(false)}>Yopish</Button>
      </div>
    </Modal>
  );

  /** CSS injection */
  const Styles = (
    <style>{`
      .yg-header{
        position: fixed;
        top: 10px; left: 10px; right: 10px;
        z-index: 1200;
        display:flex; align-items:center; gap:10px;
        pointer-events:auto;
      }
      .yg-header .ant-btn{ box-shadow: 0 6px 16px rgba(0,0,0,.18); border: none; }
      .yg-sheet{
        position: fixed;
        left: 0; right: 0; bottom: 0;
        z-index: 1100;
        background: rgba(255,255,255,.96);
        backdrop-filter: blur(10px);
        border-top-left-radius: 22px;
        border-top-right-radius: 22px;
        padding: 18px 16px 18px;
        box-shadow: 0 -14px 40px rgba(0,0,0,.18);
        max-width: 520px;
        margin: 0 auto;
      }
      .yg-sheet.hidden{ opacity:0; pointer-events:none; transform: translateY(10px); transition: .18s ease; }
      .yg-sheet-title{ display:flex; align-items:center; gap:10px; margin-bottom: 14px; }
      .yg-logo{ width:44px; height:44px; border-radius: 18px; background: linear-gradient(180deg,#f6c200,#ffdf55); }
      .yg-long{
        width: 100%;
        height: 56px;
        border-radius: 18px;
        font-size: 18px;
        font-weight: 700;
        display:flex; align-items:center; justify-content:center;
        background: #f2f2f2;
        border: none;
      }
      .yg-long-right{ margin-left: 10px; font-size: 20px; opacity:.6; }
      .yg-bottom-row{ display:flex; gap: 12px; align-items:center; margin-top: 14px; }
      .yg-blue{ flex: 1; height: 54px; border-radius: 18px; font-size: 18px; font-weight: 800; }
      .yg-yellow{ flex: 1; height: 58px; border-radius: 18px; font-size: 20px; font-weight: 900; background: #f6c200 !important; border: none !important; color: #111 !important; }
      .yg-round{ width: 54px; height: 54px; border-radius: 18px; border:none; background:#f2f2f2; box-shadow: 0 8px 22px rgba(0,0,0,.12); }
      .yg-gray{ flex:1; height: 50px; border-radius: 16px; border:none; background:#f2f2f2; font-weight:700; }
      .yg-field{ display:flex; align-items:center; gap:10px; padding: 10px 12px; border-radius: 16px; background: #fff; box-shadow: 0 8px 18px rgba(0,0,0,.06); }
      .yg-field-icon{ width: 34px; height: 34px; border-radius: 12px; display:flex; align-items:center; justify-content:center; background:#f3f3f3; }
      .yg-field-body{ flex:1; min-width:0; }
      .yg-field-label{ font-size: 12px; opacity:.7; }
      .yg-field-value{ font-size: 15px; font-weight: 700; white-space: nowrap; overflow:hidden; text-overflow: ellipsis; }
      .yg-chip{ border-radius: 999px; border:none; background:#f2f2f2; font-weight:700; }
      .yg-saved{ display:flex; flex-direction:column; gap: 10px; }
      .yg-saved-item{ width:100%; border:none; border-radius: 16px; background:#fff; display:flex; gap:10px; padding:10px 12px; box-shadow: 0 8px 18px rgba(0,0,0,.06); text-align:left; cursor:pointer;}
      .yg-saved-ic{ width: 34px; height: 34px; border-radius: 12px; background:#f3f3f3; display:flex; align-items:center; justify-content:center; }
      .yg-saved-txt{ flex:1; min-width:0; }
      .yg-saved-title{ font-weight: 800; }
      .yg-saved-sub{ font-size: 12px; opacity:.6; margin-top: 2px; white-space: nowrap; overflow:hidden; text-overflow: ellipsis;}
      .yg-search-top{ padding: 14px 14px 0; }
      .yg-search-fields{ background:#fff; border-radius: 18px; box-shadow: 0 10px 24px rgba(0,0,0,.08); overflow:hidden; }
      .yg-search-field{ display:flex; gap:10px; align-items:center; padding: 10px 12px; }
      .yg-search-field + .yg-search-field{ border-top:1px solid #eee; }
      .yg-search-ic{ width: 34px; height: 34px; border-radius: 12px; background:#f3f3f3; display:flex; align-items:center; justify-content:center; }
      .yg-search-cap{ font-size: 11px; opacity:.7; }
      .yg-li-ic{ width: 34px; height: 34px; border-radius: 12px; background:#f3f3f3; display:flex; align-items:center; justify-content:center; }
      .yg-dest-mini{ display:flex; justify-content: space-between; align-items:flex-end; gap: 10px; }
      .yg-dest-mini-left{ flex:1; min-width:0; }
      .yg-dest-mini-right{ display:flex; flex-direction: column; align-items:flex-end; gap:8px; }
      .yg-price{ font-weight: 900; font-size: 16px; }
      .yg-ready{ border-radius: 16px; height: 44px; font-weight: 900; }
      .yg-route-top{ }
      .yg-route-row{ display:flex; gap:10px; align-items:center; margin-bottom: 10px; }
      .yg-route-txt{ flex:1; min-width:0; }
      .yg-tab{ font-size:12px; font-weight:800; background:#eee; padding: 8px 12px; border-radius: 999px; }
      .yg-tariffs{ display:flex; gap: 10px; overflow-x:auto; padding-bottom: 6px; }
      .yg-tariff{ min-width: 120px; border-radius: 18px; border: 2px solid transparent; background:#fff; box-shadow: 0 10px 24px rgba(0,0,0,.08); padding: 12px 12px; text-align:left; cursor:pointer; }
      .yg-tariff.active{ border-color: #f6c200; }
      .yg-stop{ display:flex; gap:10px; align-items:center; padding: 10px 12px; border-radius: 16px; background:#fff; box-shadow: 0 8px 18px rgba(0,0,0,.06); margin-top: 8px; }
      .yg-stop-dot{ width: 10px; height: 10px; border-radius: 50%; background:#111; opacity:.55; }
      .yg-stop-addr{ font-size: 12px; opacity:.7; white-space: nowrap; overflow:hidden; text-overflow: ellipsis; }
      .yg-driver-card{ margin-top: 12px; background:#fff; border-radius: 22px; padding: 14px; box-shadow: 0 12px 26px rgba(0,0,0,.08); }
      .yg-plate-row{ display:flex; justify-content: space-between; align-items:center; margin-top: 12px; }
      .yg-plate{ font-size: 32px; font-weight: 900; letter-spacing: 1px; border: 2px solid #111; padding: 6px 12px; border-radius: 14px; }
      .yg-actions{ display:flex; gap: 10px; margin-top: 12px; }
      .yg-act{ flex:1; height: 48px; border-radius: 16px; border:none; background:#f2f2f2; font-weight:800; }
      .yg-cancel-link{ color:#ff4d4f; font-weight:900; text-align:center; padding: 8px 0 2px; cursor:pointer; }
      /* center pin overlay animation */
      .yg-center-pin{ position:absolute; left:50%; top:50%; transform: translate(-50%,-100%); z-index: 900; pointer-events:none; }
      .yg-center-pin.lift{ transform: translate(-50%,-110%); transition: .12s ease; }
      /* pin visuals */
      .yg-pin-wrap, .yg-dest-wrap{ display:flex; flex-direction:column; align-items:center; }
      .yg-pin-yellow{
        width: 44px; height: 44px; border-radius: 18px;
        background: #f6c200;
        box-shadow: 0 12px 26px rgba(0,0,0,.18);
        display:flex; align-items:center; justify-content:center;
      }
      .yg-dest-flag{
        width: 44px; height: 44px; border-radius: 18px;
        background: #fff;
        box-shadow: 0 12px 26px rgba(0,0,0,.18);
        display:flex; align-items:center; justify-content:center;
      }
      .yg-pin-stem{ width: 6px; height: 18px; background: rgba(0,0,0,.75); border-radius: 999px; margin-top: -2px; }
      .yg-pin-dot{ width: 14px; height: 14px; border-radius: 50%; border: 3px solid #fff; background: #111; margin-top: -6px; box-shadow: 0 6px 14px rgba(0,0,0,.22); }
      .yg-pin-dot.red{ background:#ff4d4f; }
      .yg-small-box{ background:#f2f2f2; border-radius: 14px; padding: 12px; }
      /* searching waves */
      .yg-wave{
        position:absolute; left:50%; top:50%;
        width: 18px; height: 18px;
        border-radius: 50%;
        border: 2px solid rgba(24,144,255,.55);
        transform: translate(-50%,-50%);
        animation: yg-wave 1.4s infinite;
        z-index: 650;
        pointer-events:none;
      }
      .yg-wave:nth-child(2){ animation-delay: .35s; }
      .yg-wave:nth-child(3){ animation-delay: .7s; }
      @keyframes yg-wave{
        0%{ opacity:.8; transform: translate(-50%,-50%) scale(1); }
        100%{ opacity:0; transform: translate(-50%,-50%) scale(7); }
      }
      /* vehicle label */
      .yg-vehicle-icon .yg-car-label{
        position:absolute;
        left:50%; top: -28px;
        transform: translateX(-50%);
        background:#fff;
        border-radius: 999px;
        padding: 6px 10px;
        font-size: 12px;
        font-weight: 900;
        box-shadow: 0 10px 20px rgba(0,0,0,.18);
        white-space: nowrap;
      }
    `}</style>
  );

  /** center pin overlay (fixed in screen center, lifts on drag) */
  const CenterPin = useMemo(() => {
    const isPickup = step === "main" || step === "search";
    const isDest = step === "dest_map";
    if (!isPickup && !isDest) return null;
    return (
      <div className={"yg-center-pin " + (isDraggingMap ? "lift" : "")}>
        <div
          dangerouslySetInnerHTML={{
            __html: isPickup ? pickupIcon.options.html : destIcon.options.html,
          }}
        />
      </div>
    );
  }, [step, isDraggingMap]);

  /** route polyline */
  const RouteLine = useMemo(() => {
    if (!route?.coords || route.coords.length < 2) return null;
    return <Polyline positions={route.coords} pathOptions={{ weight: 6, opacity: 0.9 }} />;
  }, [route]);

  /** searching visual: cars + line */
  const SearchingOverlay = step === "searching" ? (
    <>
      <div className="yg-wave" />
      <div className="yg-wave" />
      <div className="yg-wave" />
      {dispatchLine ? <Polyline positions={dispatchLine} pathOptions={{ weight: 4, opacity: 0.65, dashArray: "8 10" }} /> : null}
      {nearCars.map((c, idx) => (
        <VehicleMarker
          key={c.id}
          position={[c.lat, c.lng]}
          bearing={c.bearing}
          label={idx === dispatchIdx ? `${Math.max(1, Math.round(durationMin / 2))} daq` : undefined}
          color={idx === dispatchIdx ? "#f6c200" : "#ddd"}
          durationMs={700}
        />
      ))}
    </>
  ) : null;

  /** driver overlay in coming */
  const DriverOverlay = step === "coming" && assignedDriver?.lat && assignedDriver?.lng ? (
    <>
      <VehicleMarker
        position={[assignedDriver.lat, assignedDriver.lng]}
        bearing={assignedDriver.bearing}
        label={etaMin ? `${etaMin} daq` : undefined}
        color="#f6c200"
        durationMs={800}
      />
      {pickup.latlng ? (
        <Polyline
          positions={[
            [assignedDriver.lat, assignedDriver.lng],
            pickup.latlng,
          ]}
          pathOptions={{ weight: 6, opacity: 0.9 }}
        />
      ) : null}
    </>
  ) : null;

  const mapBottom = useMemo(() => {
    if (step === "main") return 280;
    if (step === "search") return 340;
    if (step === "dest_map") return 240;
    if (step === "route") return 330;
    if (step === "searching") return 240;
    if (step === "coming") return 380;
    return 240;
  }, [step]);

  /** map content */
  const MapUI = (
    <TaxiMap
      mapRef={mapRef}
      center={pickup.latlng || userLoc || [42.4602, 59.6156]}
      mapTile={mapTile}
      step={step}
      userLoc={userLoc}
      onRequestLocate={requestLocateNow}
      mapBottom={mapBottom}
      onCenterChange={(ll) => setCenterLatLng(ll)}
      onMoveStart={() => setIsDraggingMap(true)}
      onMoveEnd={() => setIsDraggingMap(false)}
      routeLine={RouteLine}
      searchingOverlay={SearchingOverlay}
      driverOverlay={DriverOverlay}
      centerPin={CenterPin}
    />
  );

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      {Styles}
      {MapUI}
      {Header}

      {/* Sheets by step */}
      {step === "main" && MainSheet}
      {step === "search" && null /* drawer handles UI */}
      {step === "dest_map" && DestMapSheet}
      {step === "route" && RouteSheet}
      {step === "searching" && SearchingSheet}
      {step === "coming" && ComingSheet}

      {SearchDrawer}
      {StopPickerOverlay}
      {PodyezdModal}
      {WishesModal}
      {ScheduleModal}
      {ShareModal}

      {/* Reyting modal — safar yakunlangandan keyin avtomatik ochiladi */}
      <RatingModal
        visible={ratingVisible}
        order={completedOrderForRating}
        onFinish={() => {
          setRatingVisible(false);
          setCompletedOrderForRating(null);
          // Cashback widgetini ko'rsatish (reyting yopilgandan keyin)
          if (earnedBonus > 0) {
            setTimeout(() => setBonusVisible(true), 300);
          } else {
            setTimeout(() => {
              setOrderId(null);
              setOrderStatus(null);
              setAssignedDriver(null);
              setStep("main");
            }, 500);
          }
        }}
      />

      {/* Cashback bonus widget */}
      <ClientBonusWidget
        userId={completedOrderForRating?.client_user_id || null}
        earnedPoints={earnedBonus}
        visible={bonusVisible}
        onClose={() => {
          setBonusVisible(false);
          setEarnedBonus(0);
          setTimeout(() => {
            setOrderId(null);
            setOrderStatus(null);
            setAssignedDriver(null);
            setStep("main");
          }, 500);
        }}
      />
    </div>
  );
}
  useEffect(() => {
    const onStorage = (e) => {
      if (e?.key === "savedAddresses_v1") setMyAddressesV1(loadMyAddressesV1());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);


