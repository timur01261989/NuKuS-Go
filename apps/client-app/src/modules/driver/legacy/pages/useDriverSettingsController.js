import { useCallback, useEffect, useMemo, useState } from "react";
import { message } from "antd";
import { getDefaultServiceTypes, getVehiclePreset } from "@/modules/driver/registration/uploadConfig.js";
import { normalizeServiceTypes, vehicleRowToUi } from "./driverSettings.helpers";
import {
  activateDriverVehicle,
  buildRegisterSummary,
  loadDriverSettingsData,
  persistDriverServiceTypes,
  submitDriverVehicleRequest,
} from "./driverSettings.logic.js";

export function useDriverSettingsController({ searchParams }) {
  const [loading, setLoading] = useState(true);
  const [savingServices, setSavingServices] = useState(false);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [vehicleModalMode, setVehicleModalMode] = useState("add");
  const [vehicleModalLoading, setVehicleModalLoading] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  const [application, setApplication] = useState(null);
  const [serviceTypes, setServiceTypes] = useState(getDefaultServiceTypes("light_car"));
  const [vehicles, setVehicles] = useState([]);
  const [vehicleRequests, setVehicleRequests] = useState([]);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") === "vehicles" ? "vehicles" : "services");

  const activeVehicle = useMemo(
    () => vehicles.find((item) => item.isActive) || vehicles[0] || null,
    [vehicles]
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const loaded = await loadDriverSettingsData();
      const serviceSettings = loaded.serviceSettingsRows?.[0] || null;
      setApplication(loaded.applicationData);

      const fallbackVehicleType =
        loaded.applicationData?.requested_vehicle_type ||
        loaded.applicationData?.vehicle_type ||
        "light_car";

      const resolvedServiceTypes = normalizeServiceTypes(
        serviceSettings?.service_types || loaded.applicationData?.requested_service_types,
        fallbackVehicleType
      );

      setServiceTypes(resolvedServiceTypes);
      setVehicles((loaded.vehicleRows || []).map(vehicleRowToUi));
      setVehicleRequests(
        (loaded.vehicleRequestRows || []).map((item) => ({
          id: item.id,
          request_type: item.request_type,
          status: item.status || "pending",
          payload: item.payload || {},
          created_at: item.created_at,
        }))
      );
    } catch (error) {
      message.error(error?.message || "Sozlamalarni yuklashda xato");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const nextTab = searchParams.get("tab") === "vehicles" ? "vehicles" : "services";
    setActiveTab(nextTab);
  }, [searchParams]);

  const saveServices = useCallback(async () => {
    setSavingServices(true);
    try {
      await persistDriverServiceTypes(serviceTypes);
      message.success("Xizmat turlari saqlandi");
      await loadAll();
    } catch (error) {
      message.error(error?.message || "Xizmat turlarini saqlashda xato");
    } finally {
      setSavingServices(false);
    }
  }, [loadAll, serviceTypes]);

  const openAddVehicleModal = useCallback(() => {
    setVehicleModalMode("add");
    setEditingVehicle(null);
    setVehicleModalOpen(true);
  }, []);

  const openEditVehicleModal = useCallback((vehicle) => {
    setVehicleModalMode("edit");
    setEditingVehicle(vehicle);
    setVehicleModalOpen(true);
  }, []);

  const closeVehicleModal = useCallback(() => {
    setVehicleModalOpen(false);
    setEditingVehicle(null);
  }, []);

  const handleVehicleRequestSubmit = useCallback(
    async (values) => {
      setVehicleModalLoading(true);
      try {
        const result = await submitDriverVehicleRequest({
          values,
          vehicleModalMode,
          editingVehicle,
        });
        if (result?.warnedMissingTable) return;

        message.success(
          vehicleModalMode === "edit"
            ? "Mashina o'zgartirish so'rovi yuborildi"
            : "Yangi mashina qo'shish so'rovi yuborildi"
        );

        closeVehicleModal();
        await loadAll();
      } catch (error) {
        message.error(error?.message || "Mashina so'rovini yuborishda xato");
      } finally {
        setVehicleModalLoading(false);
      }
    },
    [closeVehicleModal, editingVehicle, loadAll, vehicleModalMode]
  );

  const setActiveVehicle = useCallback(
    async (vehicleId) => {
      try {
        await activateDriverVehicle(vehicleId);
        message.success("Aktiv mashina yangilandi");
        await loadAll();
      } catch (error) {
        message.error(error?.message || "Aktiv mashinani saqlashda xato");
      }
    },
    [loadAll]
  );

  const registerSummary = useMemo(() => {
    const vehicleType = application?.requested_vehicle_type || application?.transport_type || "light_car";
    const preset = getVehiclePreset(vehicleType);
    return {
      label: preset.label,
      brand: application?.vehicle_brand || "—",
      model: application?.vehicle_model || "—",
      plate: application?.vehicle_plate || "—",
      seats: application?.seat_count ?? 0,
      cargoKg: application?.requested_max_freight_weight_kg ?? 0,
      cargoM3: application?.requested_payload_volume_m3 ?? 0,
      status: application?.status || "pending",
    };
  }, [application]);

  return {
    loading,
    savingServices,
    vehicleModalOpen,
    vehicleModalMode,
    vehicleModalLoading,
    editingVehicle,
    application,
    serviceTypes,
    setServiceTypes,
    vehicles,
    vehicleRequests,
    activeTab,
    setActiveTab,
    activeVehicle,
    loadAll,
    saveServices,
    openAddVehicleModal,
    openEditVehicleModal,
    closeVehicleModal,
    handleVehicleRequestSubmit,
    setActiveVehicle,
    registerSummary,
    registerVehiclePreset: getVehiclePreset,
  };
}
