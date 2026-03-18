import { useEffect, useMemo, useState } from "react";
import { Modal, message } from "antd";
import { buildRealtimeMeta, shouldPauseRealtime } from "@/modules/shared/domain/logistics/realtimeTelemetry.js";
import { logisticsLogger } from "@/modules/shared/domain/logistics/logisticsLogger.js";
import { useAuth } from "@/modules/shared/auth/AuthProvider";
import { clientLogger } from "@/modules/shared/utils/clientLogger.js";
import { getErrorMessage } from "@/modules/shared/utils/errorAdapter.js";
import { useClientText } from "../../shared/i18n_clientLocalize";
import { useContacts } from "../hooks/useContacts";
import {
  DELIVERY_SERVICE_MODES,
  PARCEL_TYPES,
  calculateDeliveryPrice,
  getParcelMeta,
  getRegionCenterByName,
  getStandardPointLabel,
} from "../services/deliveryConfig";
import { deliverySdk } from "@/modules/shared/domain/delivery/deliverySdk.js";
import { clampUzPhoneDigits, reverseGeocode } from "../DeliveryPage.helpers";
import {
  DELIVERY_FORM_INITIAL,
  applyDeliveryOrderToForm,
  canSubmitDeliveryForm,
  createDeliveryPayload,
  findMatchedTrip,
} from "../DeliveryPage.logic";

export function useDeliveryPageController() {
  const { user } = useAuth();
  const { cp } = useClientText();
  const { contacts, loadContacts } = useContacts();

  const [serviceMode, setServiceMode] = useState(DELIVERY_FORM_INITIAL.serviceMode);
  const [pickupMode, setPickupMode] = useState(DELIVERY_FORM_INITIAL.pickupMode);
  const [dropoffMode, setDropoffMode] = useState(DELIVERY_FORM_INITIAL.dropoffMode);
  const [parcelType, setParcelType] = useState(DELIVERY_FORM_INITIAL.parcelType);
  const [weightKg, setWeightKg] = useState(DELIVERY_FORM_INITIAL.weightKg);
  const [comment, setComment] = useState(DELIVERY_FORM_INITIAL.comment);
  const [senderPhone, setSenderPhone] = useState(DELIVERY_FORM_INITIAL.senderPhone);
  const [receiverName, setReceiverName] = useState(DELIVERY_FORM_INITIAL.receiverName);
  const [receiverPhone, setReceiverPhone] = useState(DELIVERY_FORM_INITIAL.receiverPhone);
  const [pickup, setPickup] = useState(DELIVERY_FORM_INITIAL.pickup);
  const [dropoff, setDropoff] = useState(DELIVERY_FORM_INITIAL.dropoff);

  const [orders, setOrders] = useState([]);
  const [availableTrips, setAvailableTrips] = useState([]);
  const [telemetryMeta, setTelemetryMeta] = useState(() => buildRealtimeMeta({ source: "polling", state: "idle" }));
  const [loading, setLoading] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);
  const [contactTarget, setContactTarget] = useState("receiver");
  const [editingId, setEditingId] = useState(null);
  const [mapTarget, setMapTarget] = useState(null);


useEffect(() => {
  let alive = true;
  let timer = null;

  const refresh = async ({ silent = false } = {}) => {
    if (shouldPauseRealtime() && silent) return;
    try {
      const [nextOrders, nextTrips] = await Promise.all([
        deliverySdk.listOrders(),
        deliverySdk.listOpenTrips(),
      ]);
      if (!alive) return;
      setOrders(nextOrders);
      setAvailableTrips(nextTrips);
      setTelemetryMeta(buildRealtimeMeta({
        source: "polling",
        state: "live",
        hidden: shouldPauseRealtime(),
        paused: shouldPauseRealtime(),
        lastRefreshAt: new Date().toISOString(),
      }));
    } catch (error) {
      logisticsLogger.error("delivery", "refreshDeliveryPage", { message: error?.message || "refresh failed" });
    }
  };

  const onVisibility = () => {
    if (!shouldPauseRealtime()) refresh({ silent: false });
    setTelemetryMeta((prev) => buildRealtimeMeta({ ...prev, hidden: shouldPauseRealtime(), paused: shouldPauseRealtime() }));
  };

  refresh({ silent: false });
  timer = setInterval(() => refresh({ silent: true }), 15000);
  if (typeof document !== "undefined") document.addEventListener("visibilitychange", onVisibility);

  return () => {
    alive = false;
    if (timer) clearInterval(timer);
    if (typeof document !== "undefined") document.removeEventListener("visibilitychange", onVisibility);
  };
}, []);


  useEffect(() => {
    if (serviceMode === "city") {
      setPickupMode("precise");
      setDropoffMode("precise");
    }
  }, [serviceMode]);

  const parcelMeta = useMemo(() => getParcelMeta(parcelType), [parcelType]);
  const needsWeight = parcelType === "item";
  const matchedTrip = useMemo(
    () => findMatchedTrip(availableTrips, serviceMode, pickup.region, dropoff.region),
    [availableTrips, serviceMode, pickup.region, dropoff.region]
  );
  const pickupLabel = useMemo(() => {
    if (pickupMode === "precise") return pickup.label || cp("Xaritadan aniq olish manzili");
    return getStandardPointLabel(pickup.region, pickup.district);
  }, [pickupMode, pickup.label, pickup.region, pickup.district, cp]);
  const dropoffLabel = useMemo(() => {
    if (dropoffMode === "precise") return dropoff.label || cp("Xaritadan aniq topshirish manzili");
    return getStandardPointLabel(dropoff.region, dropoff.district);
  }, [dropoffMode, dropoff.label, dropoff.region, dropoff.district, cp]);

  const price = useMemo(
    () => calculateDeliveryPrice({ serviceMode, parcelType, weightKg, pickupMode, dropoffMode }),
    [serviceMode, parcelType, weightKg, pickupMode, dropoffMode]
  );

  const canSubmit = useMemo(
    () => canSubmitDeliveryForm({
      senderPhone, receiverPhone, receiverName, pickup, dropoff, serviceMode, pickupMode, dropoffMode,
      needsWeight, weightKg, maxKg: parcelMeta.maxKg,
    }),
    [senderPhone, receiverPhone, receiverName, pickup, dropoff, serviceMode, pickupMode, dropoffMode, needsWeight, weightKg, parcelMeta.maxKg]
  );

  const resetForm = () => {
    setEditingId(null);
    setServiceMode(DELIVERY_FORM_INITIAL.serviceMode);
    setPickupMode(DELIVERY_FORM_INITIAL.pickupMode);
    setDropoffMode(DELIVERY_FORM_INITIAL.dropoffMode);
    setParcelType(DELIVERY_FORM_INITIAL.parcelType);
    setWeightKg(DELIVERY_FORM_INITIAL.weightKg);
    setComment(DELIVERY_FORM_INITIAL.comment);
    setSenderPhone(DELIVERY_FORM_INITIAL.senderPhone);
    setReceiverName(DELIVERY_FORM_INITIAL.receiverName);
    setReceiverPhone(DELIVERY_FORM_INITIAL.receiverPhone);
    setPickup(DELIVERY_FORM_INITIAL.pickup);
    setDropoff(DELIVERY_FORM_INITIAL.dropoff);
  };

  const payloadFromState = () => createDeliveryPayload({
    userId: user?.id || null,
    serviceMode, parcelType, parcelMeta, weightKg, price, comment, receiverName, receiverPhone, senderPhone,
    pickupMode, dropoffMode, pickup, dropoff, pickupLabel, dropoffLabel, matchedTrip,
  });

  const handleSubmit = async () => {
    if (parcelMeta.maxKg > 0 && Number(weightKg || 0) > parcelMeta.maxKg) {
      message.error(cp("Bu turdagi buyum og‘irligi ruxsat etilgan me’yordan oshmasligi kerak"));
      return;
    }
    setLoading(true);
    try {
      if (editingId) {
        const updated = await deliverySdk.updateOrder(editingId, payloadFromState());
        setOrders((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
        message.success(cp("Buyurtma yangilandi"));
      } else {
        const order = await deliverySdk.createOrder(payloadFromState());
        setOrders((prev) => [order, ...prev]);
        message.success(cp("Eltish xizmati yaratildi"));
      }
      resetForm();
    } catch (error) {
      clientLogger.error("delivery.save_failed", { message: error?.message, editingId });
      message.error(getErrorMessage(error, cp("Buyurtma saqlanmadi")));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (order) => {
    const setState = (field, value) => ({
      editingId: setEditingId,
      serviceMode: setServiceMode,
      pickupMode: setPickupMode,
      dropoffMode: setDropoffMode,
      parcelType: setParcelType,
      weightKg: setWeightKg,
      comment: setComment,
      senderPhone: setSenderPhone,
      receiverName: setReceiverName,
      receiverPhone: setReceiverPhone,
      pickup: setPickup,
      dropoff: setDropoff,
    }[field])(value);
    applyDeliveryOrderToForm(order, setState, clampUzPhoneDigits);
  };

  const handleDelete = (order) => {
    Modal.confirm({
      title: cp("Buyurtmani o‘chirasizmi?"),
      content: cp("Bu amalni bekor qilib bo‘lmaydi."),
      okText: cp("O‘chirish"),
      okButtonProps: { danger: true },
      cancelText: cp("Bekor qilish"),
      onOk: async () => {
        await deliverySdk.deleteOrder(order.id);
        setOrders((prev) => prev.filter((item) => item.id !== order.id));
        if (editingId === order.id) resetForm();
        message.success(cp("Buyurtma o‘chirildi"));
      },
    });
  };

  const openContacts = async (target) => {
    setContactTarget(target);
    setContactsOpen(true);
    if (contacts.length > 0) return;
    setContactsLoading(true);
    try {
      await loadContacts();
    } finally {
      setContactsLoading(false);
    }
  };

  const handlePickContact = (item) => {
    const digits = clampUzPhoneDigits(item?.phone || "");
    if (contactTarget === "sender") setSenderPhone(digits);
    else {
      setReceiverPhone(digits);
      if (!receiverName) setReceiverName(item?.name || "");
    }
    setContactsOpen(false);
  };

  const handleMapSave = async (point) => {
    const fallback = `${point[0].toFixed(5)}, ${point[1].toFixed(5)}`;
    const foundLabel = await reverseGeocode(point);
    const label = foundLabel || fallback;
    if (mapTarget === "pickup") setPickup((prev) => ({ ...prev, point, label }));
    else if (mapTarget === "dropoff") setDropoff((prev) => ({ ...prev, point, label }));
    setMapTarget(null);
  };

  const currentCenter = getRegionCenterByName(mapTarget === "pickup" ? pickup.region : dropoff.region);

  return {
    cp,
    serviceModes: DELIVERY_SERVICE_MODES,
    parcelTypes: PARCEL_TYPES,
    serviceMode, setServiceMode,
    pickupMode, setPickupMode,
    dropoffMode, setDropoffMode,
    parcelType, setParcelType,
    weightKg, setWeightKg,
    comment, setComment,
    senderPhone, setSenderPhone,
    receiverName, setReceiverName,
    receiverPhone, setReceiverPhone,
    pickup, setPickup,
    dropoff, setDropoff,
    orders,
    availableTrips,
    loading,
    contacts,
    contactsLoading,
    contactsOpen, setContactsOpen,
    contactTarget,
    editingId,
    mapTarget, setMapTarget,
    parcelMeta, needsWeight, matchedTrip,
    pickupLabel, dropoffLabel,
    price, canSubmit,
    resetForm, handleSubmit, handleEdit, handleDelete,
    openContacts, handlePickContact,
    openMap: setMapTarget, handleMapSave,
    currentCenter,
  };
}