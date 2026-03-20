import React from "react";
import { Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { supabase } from "@/services/supabase/supabaseClient";
import UnifiedParcelFeed from "../delivery-integration/feed/UnifiedParcelFeed";
import { IntegrationProvider } from "../delivery-integration/context/IntegrationContext";
import { LocationPickerModal, pointToDbValue } from "./FreightPage.helpers.jsx";
import { useFreightDriverController } from "./hooks/useFreightDriverController.js";
import FreightVehicleSetupCard from "./components/FreightVehicleSetupCard.jsx";
import FreightStatusDeck from "./components/FreightStatusDeck.jsx";

export default function FreightPage({ onBack }) {
  const controller = useFreightDriverController();
  const {
    error, info, loading, pickerOpen, setPickerOpen, currentPoint, setCurrentPoint, setCurrentAddress, vehicleId,
    isOnline, freightEnabled, deliveryEnabled, vehicleLimits, activeVehicle, plateNumber, BODY_TYPES,
    supabase: sb, connectionMeta, heartbeatMeta,
  } = controller;

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack} />
          <div>
            <div className="text-xl font-semibold">YUK TASHISH (HAYDOVCHI)</div>
            <div className="text-sm opacity-80">Moshina turini tanlang → joylashuvni xaritadan saqlang → online bo‘ling.</div>
          </div>
        </div>
        <button type="button" onClick={() => setPickerOpen(true)} disabled={loading} className="px-4 py-2 rounded-lg bg-gray-800 text-white disabled:opacity-50">Joylashuv</button>
      </div>

      {(error || info) && (
        <div className="mb-4 space-y-2">
          {error && <div className="px-4 py-3 rounded-lg bg-red-900/40 border border-red-500 text-red-100">{error}</div>}
          {info && <div className="px-4 py-3 rounded-lg bg-green-900/30 border border-green-500 text-green-100">{info}</div>}
        </div>
      )}

      <FreightVehicleSetupCard {...controller} BODY_TYPES={BODY_TYPES} />
      <FreightStatusDeck isOnline={isOnline} freightEnabled={freightEnabled} deliveryEnabled={deliveryEnabled} vehicleLimits={vehicleLimits} connectionMeta={connectionMeta} heartbeatMeta={heartbeatMeta} />

      <IntegrationProvider initialState={{ enabled: isOnline, driverMode: "CITY", capacity: { maxWeightKg: Number(vehicleLimits.maxWeightKg || 0), maxVolumeM3: Number(vehicleLimits.maxVolumeM3 || 0) } }}>
        <UnifiedParcelFeed
          supabase={supabase}
          driverId={vehicleId || activeVehicle?.id || null}
          driverMode="CITY"
          vehiclePlate={plateNumber || activeVehicle?.plateNumber || ""}
          parcelFilter={{
            serviceArea: "city",
            orderType: "freight",
            maxWeightKg: Number(vehicleLimits.maxWeightKg || 0),
            maxVolumeM3: Number(vehicleLimits.maxVolumeM3 || 0),
          }}
        />
      </IntegrationProvider>

      <LocationPickerModal
        open={pickerOpen}
        initialPoint={currentPoint}
        onCancel={() => setPickerOpen(false)}
        onSave={async (p, addr) => {
          setPickerOpen(false);
          if (!p) return;
          setCurrentPoint(p);
          setCurrentAddress(addr || "");
          try {
            if (vehicleId) {
              await supabase
                .from("vehicles")
                .update({
                  current_point: pointToDbValue(p),
                  current_updated_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq("id", vehicleId);
            }
          } catch {}
        }}
      />
    </div>
  );
}