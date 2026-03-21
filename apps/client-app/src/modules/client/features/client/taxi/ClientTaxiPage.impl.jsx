import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useClientText } from "../shared/i18n_clientLocalize";
import taxiLogger from "../../../../shared/taxi/utils/taxiLogger";
import { useNavigate } from "react-router-dom";
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
  CompassOutlined,
} from "@ant-design/icons";
import { MapContainer, Polyline, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { CenterWatcher, LocateMeButton, destIcon, pickupIcon } from "./taxiMapArtifacts";

import VehicleMarker from "./components/VehicleMarker";
import TaxiMap from "./TaxiMap";
import { normalizeLatLng, toNum } from "./utils/latlng";
import TaxiSearchSheet from "./TaxiSearchSheet";
import DestinationPicker from "./DestinationPicker";
import { haversineKm } from "../shared/geo/haversine";
import ClientTaxiScreen from "./containers/ClientTaxiScreen";
import RatingModal from "@/modules/client/features/shared/components/RatingModal.jsx";
import ClientBonusWidget from "@/modules/client/features/client/components/ClientBonusWidget.jsx";
import TaxiOrderTimeline from "./components/TaxiOrderTimeline";
import TaxiMainSheet from "./components/TaxiMainSheet";
import TaxiRouteSheet from "./components/TaxiRouteSheet";
import { useOrderTimeline } from "./hooks/useOrderTimeline";
import {
  useTaxiOrder,
  money,
  clamp,
  speak,
  tileDay,
  tileNight,
  MAX_KM,
  savePlace,
} from "./hooks/useTaxiOrder";

const { Text } = Typography;

/** --- main component --- */
export default function ClientTaxiPage() {
  const { cp } = useClientText();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const tariffSectionRef = useRef(null);
  const scrollTariffOnOpenRef = useRef(false);

  // Use the custom hook
  const {
    step,
    setStep,
    darkMode,
    setDarkMode,
    userLoc,
    setUserLoc,
    pickup,
    setPickup,
    dest,
    setDest,
    waypoints,
    setWaypoints,
    centerLatLng,
    setCenterLatLng,
    isDraggingMap,
    setIsDraggingMap,
    searchOpen,
    setSearchOpen,
    pickupSearchText,
    setPickupSearchText,
    destSearchText,
    setDestSearchText,
    pickupResults,
    destResults,
    searchBusy,
    searchResults,
    savedPlaces,
    setSavedPlaces,
    myAddressesV1,
    homeAddr,
    workAddr,
    route,
    setRoute,
    tariff,
    setTariff,
    tariffs,
    orderId,
    setOrderId,
    orderStatus,
    setOrderStatus,
    assignedDriver,
    setAssignedDriver,
    ratingVisible,
    setRatingVisible,
    completedOrderForRating,
    setCompletedOrderForRating,
    bonusVisible,
    setBonusVisible,
    earnedBonus,
    setEarnedBonus,
    etaMin,
    setEtaMin,
    etaUpdatedAt,
    setEtaUpdatedAt,
    podyezdOpen,
    setPodyezdOpen,
    shareOpen,
    setShareOpen,
    addStopOpen,
    setAddStopOpen,
    orderFor,
    setOrderFor,
    otherPhone,
    setOtherPhone,
    wishesOpen,
    setWishesOpen,
    wishes,
    setWishes,
    comment,
    setComment,
    scheduleOpen,
    setScheduleOpen,
    scheduledTime,
    setScheduledTime,
    shortcuts,
    setShortcuts,
    nearCars,
    setNearCars,
    dispatchLine,
    setDispatchLine,
    dispatchIdx,
    setDispatchIdx,
    pickupAddrFromCenter,
    destAddrFromCenter,
    distanceKm,
    durationMin,
    totalPrice,
    showSheet,
    shareLink,
    mapBottom,
    setPickupFromSuggestion,
    setDestFromSuggestion,
    applyDestinationFromAddressString,
    handleOrderCreate,
    handleCancel,
  } = useTaxiOrder();

  const { events: timelineEvents } = useOrderTimeline(orderId);
  const cancelReasonOptions = buildTaxiCancelReasons();
  const routeMeta = buildTaxiRouteMeta(route);

  // Mobile BACK handling
  const isPopNavRef = useRef(false);
  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    const st = { __taxiStep: step };
    if (!isPopNavRef.current) {
      try {
        window.history.pushState(st, "");
      } catch (error) {
        taxiLogger.warn("client.taxi.page.copy_driver_phone_failed", { error });
      }
    }
    isPopNavRef.current = false;
  }, [step]);

  useEffect(() => {
    const onPop = (e) => {
      isPopNavRef.current = true;
      const cur = stepRef.current;

      if (cur === "stop_map") {
        setStep("route");
        return;
      }
      if (cur === "searching" || cur === "coming") {
        setStep("route");
        return;
      }
      if (cur === "route") {
        setStep("main");
        return;
      }
      if (cur === "dest_map") {
        setStep("search");
        return;
      }
      if (cur === "search") {
        setStep("main");
        return;
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const requestLocateNow = useCallback(() => {
    if (!navigator.geolocation) {
      message.error(cp("Geolokatsiya mavjud emas"));
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const ll = [pos.coords.latitude, pos.coords.longitude];
          setUserLoc(ll);
          setPickup((p) => ({ ...p, latlng: ll }));
          const map = mapRef.current;
          if (map) map.flyTo(ll, 16, { duration: 0.6 });
          resolve(ll);
        },
        () => {
          message.error(cp("Joylashuvni aniqlab bo'lmadi"));
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    });
  }, [cp, message]);

  // Suggestions callbacks
  const setPickupFromSuggestionHandler = useCallback(
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
      if (dest?.latlng) setStep("route");
    },
    [dest?.latlng]
  );

  const setDestFromSuggestionHandler = useCallback(
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
      if (pickup?.latlng) setStep("route");
    },
    [pickup?.latlng]
  );

  // Navigation callbacks
  const openDestinationSearch = useCallback(() => {
    setSearchOpen(true);
    setStep("search");
    setPickupSearchText(pickup.address || "");
    setDestSearchText(dest.address || "");
  }, [pickup.address, dest.address]);

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

  const chooseDestination = useCallback(
    (item) => {
      if (!item) return;
      setDest({ latlng: [item.lat, item.lng], address: item.label });
      setSavedPlaces(savePlace({ id: String(item.id || Date.now()), title: item.label, lat: item.lat, lng: item.lng, type: "recent" }));
      setSearchOpen(false);
      setStep("route");
    },
    []
  );

  const openPickupMapEdit = useCallback(() => {
    setStep("main");
    setSearchOpen(false);
    message.info(cp("Xaritani siljitib yo'lovchini olish nuqtasini o'zgartiring"));
  }, []);

  const openDestMapEdit = useCallback(() => {
    setStep("dest_map");
    setSearchOpen(false);
    const map = mapRef.current;
    if (map) {
      const c = dest.latlng || pickup.latlng || userLoc;
      if (c) map.flyTo(c, 16, { duration: 0.6 });
    }
  }, [dest.latlng, pickup.latlng, userLoc]);

  const openDestMapSelect = openDestMapEdit;

  const openShareRide = useCallback(() => {
    setShareOpen(true);
  }, []);

  const addStopFromCenter = useCallback(() => {
    if (!centerLatLng) return;
    const addr = step === "dest_map" ? (destAddrFromCenter || "") : (pickupAddrFromCenter || "");
    const stop = { latlng: centerLatLng, address: addr || cp("Oraliq bekat") };
    setWaypoints((w) => [...w, stop].slice(0, 3));
    setAddStopOpen(false);
    message.success(cp("Oraliq bekat qo'shildi"));
  }, [centerLatLng, step, destAddrFromCenter, pickupAddrFromCenter]);

  const handlePickSaved = useCallback(
    (p) => {
      if (!p) return;
      setDest({ latlng: [Number(p.lat), Number(p.lng)], address: p.label || p.name || "" });
      setStep("route");
    },
    []
  );

  const updateEntrance = useCallback((val) => {
    setPickup((p) => ({ ...p, entrance: val }));
  }, []);

  const changeDestination = useCallback(() => {
    setStep("dest_map");
  }, []);

  // Tariff scroll effect
  useEffect(() => {
    if (step === "route" && scrollTariffOnOpenRef.current) {
      scrollTariffOnOpenRef.current = false;
      setTimeout(() => {
        try {
          tariffSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        } catch (error) {
          taxiLogger.warn("client.taxi.page.copy_car_number_failed", { error });
        }
      }, 50);
    }
  }, [step]);

  // Header
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

  const Header = (
    <div className="yg-header">
      <Button
        type="default"
        shape="circle"
        icon={<ArrowLeftOutlined />}
        onClick={() => {
          const cur = stepRef.current;
          if (cur === "stop_map") { setStep("route"); return; }
          if (cur === "searching" || cur === "coming") { setStep("route"); return; }
          if (cur === "route") { setStep(dest?.latlng ? "dest_map" : "main"); return; }
          if (cur === "dest_map") { setStep("search"); return; }
          if (cur === "search") { setStep("main"); return; }
          if (window.history.length > 1) navigate(-1);
          else navigate("/", { replace: true });
        }}
        style={{
          width: 40,
          height: 40,
          border: "none",
          boxShadow: "0 6px 16px rgba(0,0,0,.18)",
          background: "#fff",
        }}
      />
      <div style={{ flex: 1 }} />
      {headerRight}
    </div>
  );

  // Summary rows
  const PickupSummaryRow = (
    <div className="yg-field">
      <div className="yg-field-icon">
        <EnvironmentOutlined />
      </div>
      <div className="yg-field-body">
        <div className="yg-field-label">Yo'lovchini olish nuqtasi</div>
        <div className="yg-field-value">{pickup.address || cp("Manzilingiz aniqlanmoqda...")}</div>
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
        <div className="yg-field-value">{dest.address || cp("Qaerga borasiz?")}</div>
      </div>
      <Button size="small" className="yg-chip" onClick={openDestinationSearch}>
        {dest.address ? cp("O'zgartirish") : cp("Qidirish")}
      </Button>
    </div>
  );

  // Sheets
  const MainSheet = (
    <TaxiMainSheet
      homeAddr={homeAddr}
      workAddr={workAddr}
      savedPlaces={savedPlaces}
      pickupSummaryRow={PickupSummaryRow}
      openDestinationSearch={openDestinationSearch}
      applyDestinationFromAddressString={applyDestinationFromAddressString}
      handlePickSaved={handlePickSaved}
      handleOrderCreate={handleOrderCreate}
      onTariffOpen={() => {
        if (step !== "route") {
          scrollTariffOnOpenRef.current = true;
          setStep("route");
          return;
        }
        try {
          tariffSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        } catch (error) {
          taxiLogger.warn("client.taxi.page.copy_trip_id_failed", { error });
        }
      }}
    />
  );

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
      searchLoading={searchBusy}
      searchResults={searchResults}
      savedPlaces={savedPlaces}
      setDestFromSuggestion={setDestFromSuggestionHandler}
      setPickupFromSuggestion={setPickupFromSuggestionHandler}
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

  const RouteSheet = (
    <TaxiRouteSheet
      pickup={pickup}
      dest={dest}
      openDestinationSearch={openDestinationSearch}
      changeDestination={changeDestination}
      setAddStopOpen={setAddStopOpen}
      setStep={setStep}
      waypoints={waypoints}
      setWaypoints={setWaypoints}
      message={message}
      navigate={navigate}
      tariffs={tariffs}
      tariff={tariff}
      setTariff={setTariff}
      durationMin={durationMin}
      distanceKm={distanceKm}
      money={money}
      orderFor={orderFor}
      setOrderFor={setOrderFor}
      otherPhone={otherPhone}
      setOtherPhone={setOtherPhone}
      setScheduleOpen={setScheduleOpen}
      comment={comment}
      wishes={wishes}
      scheduledTime={scheduledTime}
      handleOrderCreate={handleOrderCreate}
      setShareOpen={setShareOpen}
      tariffSectionRef={tariffSectionRef}
      routeMeta={routeMeta}
    />
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

    </div>
  );

  const ComingSheet = (
    <div className="yg-sheet">
      <div style={{ fontSize: 26, fontWeight: 900 }}>
        {etaMin ? `~${etaMin} daq va keladi` : "Haydovchi yo'lda"}
      </div>

      <div style={{ marginTop: 10 }}>
        <TaxiEtaBadge
          etaMin={etaMin}
          distanceKm={assignedDriver?.lat != null && assignedDriver?.lng != null && pickup?.latlng ? Number((Math.hypot((assignedDriver.lat - pickup.latlng[0]) * 111, (assignedDriver.lng - pickup.latlng[1]) * 85)).toFixed(1)) : null}
          etaUpdatedAt={etaUpdatedAt}
          isFallback={routeMeta?.isFallback}
        />
      </div>

      <div className="yg-driver-card">
        <div className="yg-driver-top">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 16, fontWeight: 900 }}>
              Haydovchi <span style={{ marginLeft: 6 }}><StarFilled style={{ color: "#faad14" }} /> {assignedDriver?.rating?.toFixed?.(2) || "—"}</span>
            </div>
          </div>
          <div style={{ opacity: 0.75 }}>{assignedDriver?.car_model || "Mashina ma'lumoti yo'q"}</div>
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


      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>Bekor qilish sababi</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {cancelReasonOptions.map((reason) => (
            <Button key={reason.key} size="small" className="yg-chip" onClick={() => handleCancel(reason.key)}>
              {reason.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="yg-cancel-link" onClick={() => handleCancel(null)}>
        Safarni bekor qilish
      </div>
    </div>
  );

  // Stop picker overlay
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
        <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 6 }}>Oraliq bekat qo'shish</div>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 10 }}>
          Xaritani kerakli joyga olib boring, so'ng "Qo'shish"ni bosing.
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
            Qo'shish
          </Button>
        </div>
      </div>
    </div>
  );

  // Modals
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
        Podyezd haydovchiga aniq eshik tagiga kelish uchun ko'rsatiladi.
      </div>
    </Modal>
  );

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
          🧳 Yukxona (bagaj) bo'sh bo'lsin
        </Checkbox>
        <Checkbox
          checked={!!wishes.childSeat}
          onChange={(e) => setWishes((w) => ({ ...w, childSeat: e.target.checked }))}
        >
          👶 Bolalar o'rindig'i (kreslo)
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
              } catch (error) {
                taxiLogger.warn("client.taxi.page.invalid_schedule_time", { error });
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

  const ShareModal = (
    <Modal
      open={shareOpen}
      onCancel={() => setShareOpen(false)}
      footer={null}
      title="Buyurtmani ulashish"
      zIndex={6500}
      getContainer={document.body}
    >
      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
        Havolani do'stingizga yuboring. U sizning holatingizni ko'ra oladi.
      </div>
      <Input value={shareLink} readOnly />
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <Button
          type="primary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(shareLink);
              message.success("Nusxa olindi");
            } catch (error) {
              taxiLogger.warn("client.taxi.page.copy_address_failed", { error });
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

  // Map tile selection
  const mapTile = darkMode ? tileNight : tileDay;

  // Center pin
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

  // Route line
  const RouteLine = useMemo(() => {
    if (!route?.coords || route.coords.length < 2) return null;
    return <Polyline positions={route.coords} pathOptions={{ weight: 6, opacity: 0.9 }} />;
  }, [route]);

  // Searching overlay
  const SearchingOverlay = step === "searching" ? (
    <>
      <div className="yg-wave" />
      <div className="yg-wave" />
      <div className="yg-wave" />
      {(dispatchLine?.length ?? 0) > 1 ? (
        <Polyline positions={dispatchLine} pathOptions={{ weight: 4, opacity: 0.65, dashArray: "8 10" }} />
      ) : null}
      {nearCars.map((c, idx) => {
        const pos = normalizeLatLng([toNum(c.lat), toNum(c.lng)]);
        if (!pos) return null;
        return (
          <VehicleMarker
            key={c.id}
            position={pos}
            bearing={c.bearing}
            label={idx === dispatchIdx ? `${Math.max(1, Math.round(durationMin / 2))} daq` : undefined}
            color={idx === dispatchIdx ? "#f6c200" : "#ddd"}
            durationMs={700}
          />
        );
      })}
    </>
  ) : null;

  // Driver overlay
  const DriverOverlay = step === "coming" && normalizeLatLng([toNum(assignedDriver?.lat), toNum(assignedDriver?.lng)]) ? (
    <>
      <VehicleMarker
        position={normalizeLatLng([toNum(assignedDriver?.lat), toNum(assignedDriver?.lng)])}
        bearing={assignedDriver?.bearing}
        label={etaMin ? `${etaMin} daq` : undefined}
        color="#f6c200"
        durationMs={800}
      />
      {normalizeLatLng(pickup?.latlng) ? (
        <Polyline
          positions={[
            normalizeLatLng([toNum(assignedDriver?.lat), toNum(assignedDriver?.lng)]),
            normalizeLatLng(pickup?.latlng),
          ]}
          pathOptions={{ weight: 6, opacity: 0.9 }}
        />
      ) : null}
    </>
  ) : null;


  // Map UI
  const mapCenter = useMemo(() => {
    const dynamicSteps = new Set(["main", "search", "dest_map", "stop_map"]);
    if (dynamicSteps.has(step) && normalizeLatLng(centerLatLng)) {
      return normalizeLatLng(centerLatLng);
    }
    return normalizeLatLng(pickup?.latlng) || userLoc || [42.4602, 59.6156];
  }, [step, centerLatLng, pickup?.latlng, userLoc]);

  const MapUI = (
    <TaxiMap
      mapRef={mapRef}
      center={mapCenter}
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

  // Styles
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
      .yg-center-pin{ position:absolute; left:50%; top:50%; transform: translate(-50%,-100%); z-index: 900; pointer-events:none; }
      .yg-center-pin.lift{ transform: translate(-50%,-110%); transition: .12s ease; }
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

  const overlaysNode = (
    <>
      {SearchDrawer}
      {StopPickerOverlay}
    </>
  );

  const modalsNode = (
    <>
      {PodyezdModal}
      {WishesModal}
      {ScheduleModal}
      {ShareModal}
    </>
  );

  const timelineNode = orderId ? (
    <div style={{ position: 'fixed', left: 12, right: 12, bottom: step === 'coming' ? 260 : 120, zIndex: 1150, maxWidth: 520, margin: '0 auto', pointerEvents: 'none' }}>
      <div style={{ pointerEvents: 'auto' }}>
        <TaxiOrderTimeline events={timelineEvents} />
      </div>
    </div>
  ) : null;

  const ratingNode = (
    <RatingModal
      visible={ratingVisible}
      order={completedOrderForRating}
      onFinish={() => {
        setRatingVisible(false);
        setCompletedOrderForRating(null);
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
  );

  const bonusNode = (
    <ClientBonusWidget
      userId={completedOrderForRating?.user_id || null}
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
  );

  return (
    <ClientTaxiScreen
      step={step}
      stylesNode={Styles}
      mapNode={MapUI}
      headerNode={Header}
      mainSheet={MainSheet}
      destMapSheet={DestMapSheet}
      routeSheet={RouteSheet}
      searchingSheet={SearchingSheet}
      comingSheet={ComingSheet}
      overlaysNode={overlaysNode}
      modalsNode={modalsNode}
      timelineNode={timelineNode}
      ratingNode={ratingNode}
      bonusNode={bonusNode}
    />
  );
}
