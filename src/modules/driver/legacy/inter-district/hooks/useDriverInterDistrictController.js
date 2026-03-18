import { useCallback, useMemo, useState } from "react";
import { message } from "antd";
import { useDistrict } from "../context/DistrictContext";
import { usePremiumSocket } from "./usePremiumSocket";
import { useDriverOnline } from "../../core/useDriverOnline";
import { canUseOrderTypeInArea } from "../../core/driverCapabilityService";
import { canActivateService } from "../../core/serviceGuards";
import { useDriverText } from "../../shared/i18n_driverLocalize";
import {
  buildQueueHealthMeta,
  buildDriverTripPreview,
  buildConflictGuard,
  buildReservationReadiness,
} from "@/modules/shared/interdistrict/domain/interDistrictSignals";

export function useDriverInterDistrictController() {
  const { cp } = useDriverText();
  const district = useDistrict();
  const { mode, MODES, upsertPremiumClient, premiumClients = [], pricing, seats = {} } = district;
  const { isOnline, activeService, setOnline, serviceTypes, activeVehicle } = useDriverOnline();
  const serviceType = "interDist";
  const serviceActive = isOnline && activeService === serviceType;

  const passengerEnabled = useMemo(() => canUseOrderTypeInArea({ serviceTypes }, "interdistrict", "passenger"), [serviceTypes]);
  const deliveryEnabled = useMemo(() => canUseOrderTypeInArea({ serviceTypes }, "interdistrict", "delivery"), [serviceTypes]);
  const freightEnabled = useMemo(() => canUseOrderTypeInArea({ serviceTypes }, "interdistrict", "freight"), [serviceTypes]);

  const [tripCreateOpen, setTripCreateOpen] = useState(false);
  const [pitakAdminOpen, setPitakAdminOpen] = useState(false);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [parcelOpen, setParcelOpen] = useState(false);
  const [activeTrip, setActiveTrip] = useState(null);
  const [respondingRequestId, setRespondingRequestId] = useState(null);

  const socketMeta = usePremiumSocket({
    enabled: serviceActive && mode === MODES.PREMIUM,
    onClientRequest: (request) => {
      upsertPremiumClient(request);
      message.info(cp("Yangi buyurtma keldi!"));
    },
  });

  const handleTripCreated = useCallback((trip) => {
    setActiveTrip(trip);
    setTripCreateOpen(false);
    setOnline(serviceType);
    message.success(cp("Reys muvaffaqiyatli e'lon qilindi!"));
  }, [cp, setOnline]);

  const beforeToggleOnline = useCallback(() => {
    if (!canActivateService(activeService, serviceType)) {
      message.warning(cp("Avval boshqa xizmatni offline qiling"));
      return false;
    }
    if (!activeTrip) {
      setTripCreateOpen(true);
      return false;
    }
    return true;
  }, [activeService, activeTrip, cp]);

  const tripFlags = {
    hasDelivery: Boolean(activeTrip?.has_delivery ?? activeTrip?.has_eltish),
    hasFreight: Boolean(activeTrip?.has_freight ?? activeTrip?.has_yuk),
    womenOnly: Boolean(activeTrip?.women_only ?? activeTrip?.female_only),
  };

  const queueHealth = useMemo(
    () => buildQueueHealthMeta({ requests: premiumClients || [], serviceActive, mode, lastSocketEventAt: socketMeta.lastEventAt }),
    [premiumClients, serviceActive, mode, socketMeta.lastEventAt]
  );

  const tripPreview = useMemo(
    () => buildDriverTripPreview({ pricing, seats, activeTrip }),
    [pricing, seats, activeTrip]
  );

  const conflictGuard = useMemo(
    () => buildConflictGuard({ activeTrip, respondingRequestId }),
    [activeTrip, respondingRequestId]
  );

  const reservationReadiness = useMemo(() => buildReservationReadiness(activeTrip), [activeTrip]);

  return {
    cp,
    district,
    mode,
    MODES,
    serviceType,
    serviceActive,
    passengerEnabled,
    deliveryEnabled,
    freightEnabled,
    activeVehicle,
    activeTrip,
    setActiveTrip,
    tripFlags,
    tripCreateOpen,
    setTripCreateOpen,
    pitakAdminOpen,
    setPitakAdminOpen,
    requestsOpen,
    setRequestsOpen,
    parcelOpen,
    setParcelOpen,
    handleTripCreated,
    beforeToggleOnline,
    socketMeta,
    queueHealth,
    tripPreview,
    conflictGuard,
    respondingRequestId,
    setRespondingRequestId,
    reservationReadiness,
  };
}
