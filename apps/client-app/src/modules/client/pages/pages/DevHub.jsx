import React, { useMemo, useState } from "react";
import { Alert, Button, Card, Collapse, Divider, Input, Space, Typography } from "antd";
import { useLocation } from "react-router-dom";
import { usePageI18n } from "./pageI18n";

const { Title, Text } = Typography;

/**
 * DevHub
 * - Hidden utilities page to keep optional modules reachable without changing app behavior.
 * - Access: /__dev?dev=1
 */
export default function DevHub() {
  const location = useLocation();
  const { tx } = usePageI18n();
  const qp = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const ok = qp.get("dev") === "1";

  const [filter, setFilter] = useState("");
  const [logs, setLogs] = useState([]);

  function log(line) {
    setLogs((p) => [{ t: new Date().toISOString(), line }, ...p].slice(0, 200));
  }

  const demos = useMemo(
    () => [
      // Components / UI
      {
        key: "HdrTaxiMapShell",
        kind: "component",
        title: "HdrTaxiMapShell (UI shell)",
        load: () => import("../components/HdrTaxiMapShell.jsx"),
      },
      {
        key: "ChatModule",
        kind: "component",
        title: "ChatModule",
        load: () => import("../../features/chat/ChatModule.jsx"),
      },
      {
        key: "AddressAutocomplete",
        kind: "component",
        title: "AddressAutocomplete",
        load: () => import("../../features/client/components/AddressAutocomplete.jsx"),
      },
      {
        key: "ClientMap",
        kind: "component",
        title: "ClientMap",
        load: () => import("../../features/client/components/ClientMap.jsx"),
      },
      {
        key: "PaymentStatus",
        kind: "component",
        title: "PaymentStatus",
        load: () => import("../../features/client/components/PaymentStatus.jsx"),
      },
      {
        key: "DriverOrderFeed",
        kind: "component",
        title: "DriverOrderFeed",
        load: () => import("../../../driver/legacy/components/DriverOrderFeed.jsx"),
      },
      {
        key: "DriverServiceSelect",
        kind: "component",
        title: "DriverServiceSelect",
        load: () => import("../../../driver/legacy/components/DriverServiceSelect.jsx"),
      },
      {
        key: "DriverVerification",
        kind: "component",
        title: "DriverVerification",
        load: () => import("../../../driver/legacy/components/DriverVerification.jsx"),
      },
      {
        key: "MapView",
        kind: "component",
        title: "MapView",
        load: () => import("../../features/map/components/MapView.jsx"),
      },
      {
        key: "RideDrawer",
        kind: "component",
        title: "RideDrawer",
        load: () => import("../../features/ride/components/RideDrawer.jsx"),
      },
      {
        key: "RideHistory",
        kind: "component",
        title: "RideHistory",
        load: () => import("../../features/shared/components/RideHistory.jsx"),
      },
      {
        key: "OrderRealtimeDebug",
        kind: "component",
        title: "OrderRealtimeDebug",
        load: () => import("../../features/taxi/components/OrderRealtimeDebug.jsx"),
      },
      {
        key: "RatingCelebration",
        kind: "component",
        title: "RatingCelebration",
        load: () => import("../../features/ui/components/RatingCelebration.jsx"),
      },
      {
        key: "LottieView",
        kind: "component",
        title: "LottieView",
        load: () => import("../shared/components/LottieView.jsx"),
      },

      // Hooks / utils (run smoke checks)
      { key: "useDriverLocationRealtime", kind: "module", title: "useDriverLocationRealtime", load: () => import("../hooks/useDriverLocationRealtime.js") },
      { key: "useDriverLocationSmoothed", kind: "module", title: "useDriverLocationSmoothed", load: () => import("../hooks/useDriverLocationSmoothed.js") },
      { key: "useGeoLocation", kind: "module", title: "hooks/useGeoLocation (startTracking)", load: () => import("../hooks/useGeoLocation.js") },
      { key: "useOrderRealtime", kind: "module", title: "useOrderRealtime", load: () => import("../hooks/useOrderRealtime.js") },

      { key: "useGeolocation", kind: "module", title: "features/location/useGeolocation", load: () => import("../../features/location/hooks/useGeolocation.js") },
      { key: "useReverseGeocode", kind: "module", title: "features/location/useReverseGeocode", load: () => import("../../features/location/hooks/useReverseGeocode.js") },

      { key: "useRoutePricing", kind: "module", title: "useRoutePricing", load: () => import("../../features/ride/hooks/useRoutePricing.js") },

      { key: "useDriverRadarSearch", kind: "module", title: "useDriverRadarSearch", load: () => import("../../../driver/legacy/hooks/useDriverRadarSearch.js") },
      { key: "driverSearchService", kind: "module", title: "driverSearchService", load: () => import("../../../driver/legacy/components/services/driverSearchService.js") },
      { key: "orderService", kind: "module", title: "orderService", load: () => import("../../../driver/legacy/components/services/orderService.js") },
      { key: "driverData", kind: "module", title: "driverData (mock)", load: () => import("../../../driver/legacy/components/driverData.js") },

      // Providers
      { key: "trafficProvider", kind: "module", title: "traffic provider", load: () => import("../providers/traffic/index.js") },

      // Services (Supabase related) — keep behind click so app startup doesn't evaluate them.
      { key: "authSupabase", kind: "service", title: "authSupabase", load: () => import("../services/authSupabase.js") },
      { key: "chatApi", kind: "service", title: "chatApi", load: () => import("../services/chatApi.js") },
      { key: "chatRealtime", kind: "service", title: "chatRealtime", load: () => import("../services/chatRealtime.js") },
      { key: "checkoutApi", kind: "service", title: "checkoutApi", load: () => import("../services/checkoutApi.js") },
      { key: "heatmapApi", kind: "service", title: "heatmapApi", load: () => import("../services/heatmapApi.js") },
      { key: "notificationsRealtime", kind: "service", title: "notificationsRealtime", load: () => import("../services/notificationsRealtime.js") },
      { key: "orderEnrichment", kind: "service", title: "orderEnrichment", load: () => import("../services/orderEnrichment.js") },
      { key: "orderModel", kind: "service", title: "orderModel", load: () => import("../services/orderModel.js") },
      { key: "ordersApi", kind: "service", title: "ordersApi", load: () => import("../services/ordersApi.js") },
      { key: "ordersRealtime", kind: "service", title: "ordersRealtime", load: () => import("../services/ordersRealtime.js") },
      { key: "pricingService", kind: "service", title: "pricingService", load: () => import("../services/pricingService.js") },
      { key: "promoApi", kind: "service", title: "promoApi", load: () => import("../services/promoApi.js") },
      { key: "soundService", kind: "service", title: "soundService", load: () => import("../services/soundService.js") },
      { key: "supabase", kind: "service", title: "supabase", load: () => import("@/services/supabase/supabaseClient.js") },
      { key: "telemetryService", kind: "service", title: "telemetryService", load: () => import("../services/telemetryService.js") },
      { key: "voiceService", kind: "service", title: "voiceService", load: () => import("../services/voiceService.js") },
      { key: "walletApi", kind: "service", title: "walletApi", load: () => import("../services/walletApi.js") },

      // Shared utils
      { key: "useAppPrefs", kind: "module", title: "useAppPrefs", load: () => import("../shared/prefs/useAppPrefs.js") },
      { key: "iconRegistry", kind: "module", title: "iconRegistry", load: () => import("../shared/utils/iconRegistry.js") },
      { key: "locationOptions", kind: "module", title: "locationOptions", load: () => import("../shared/utils/locationOptions.js") },
      { key: "mapStyle", kind: "module", title: "mapStyle", load: () => import("../shared/utils/mapStyle.js") },
      { key: "memo", kind: "module", title: "memo", load: () => import("../shared/utils/memo.js") },
      { key: "routingOptions", kind: "module", title: "routingOptions", load: () => import("../shared/utils/routingOptions.js") },

      // Utils
      { key: "NukusPlaces", kind: "module", title: "NukusPlaces", load: () => import("../utils/NukusPlaces.js") },
      { key: "audioHelper", kind: "module", title: "audioHelper", load: () => import("../utils/audioHelper.js") },
      { key: "geo", kind: "module", title: "geo", load: () => import("../utils/geo.js") },
      { key: "imageUtils", kind: "module", title: "imageUtils", load: () => import('@/modules/shared/utils/imageUtils.js') },
      { key: "locationSmoothing", kind: "module", title: "locationSmoothing", load: () => import("../utils/locationSmoothing.js") },
      { key: "navigatorSync", kind: "module", title: "navigatorSync", load: () => import("../utils/navigatorSync.js") },

      // Unused dependency smoke (kept optional)
      { key: "leafletRoutingMachine", kind: "module", title: "react-leaflet-routing-machine (dependency smoke)", load: () => import("react-leaflet-routing-machine") },
    ],
    [location.search]
  );

  if (!ok) {
    return (
      <div style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
        <Alert
          type="warning"
          showIcon
          message={tx("devHubClosed", "DevHub yopiq")}
          description={
            <div>
              <div>{tx("devHubOpen", "Ochish uchun URL")}: <Text code>/__dev?dev=1</Text></div>
              <div style={{ marginTop: 8 }}>
                {tx("devHubHidden", "Bu sahifa production behavior'ni o‘zgartirmaslik uchun yashirilgan.")}
              </div>
            </div>
          }
        />
      </div>
    );
  }

  const filtered = demos.filter((d) => {
    if (!filter.trim()) return true;
    const f = filter.trim().toLowerCase();
    return (d.title || "").toLowerCase().includes(f) || (d.key || "").toLowerCase().includes(f) || (d.kind || "").toLowerCase().includes(f);
  });

  async function runLoad(d) {
    try {
      log(`loading: ${d.key}`);
      const mod = await d.load();
      const keys = Object.keys(mod || {});
      log(`loaded: ${d.key} -> exports: ${keys.length ? keys.join(", ") : "(default only / empty)"}`);

      // If component, try to render a tiny preview
      if (d.kind === "component") {
        const C = mod?.default || mod?.[d.key] || mod?.ChatModule || null;
        if (C) {
          return { ok: true, component: C };
        }
      }
      return { ok: true, mod };
    } catch (e) {
      log(`ERROR: ${d.key} -> ${e?.message || String(e)}`);
      return { ok: false, error: e };
    }
  }

  const [previews, setPreviews] = useState({});

  async function onPreview(d) {
    const res = await runLoad(d);
    setPreviews((p) => ({ ...p, [d.key]: res }));
  }

  return (
    <div style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
      <Title level={3} style={{ marginTop: 0 }}>
        DevHub
      </Title>

      <Alert
        type="info"
        showIcon
        message="Eslatma"
        description={tx("devDesc", "Bu sahifa faqat dev/diagnostika uchun. Asosiy ilova oqimi va UI o‘zgarmaydi.")}
        style={{ marginBottom: 12 }}
      />

      <Space style={{ width: "100%", marginBottom: 12 }} direction="vertical">
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter: component/service/module..."
          allowClear
        />
        <Text type="secondary">
          Topilgan: {filtered.length} ta / Jami: {demos.length} ta
        </Text>
      </Space>

      <Collapse
        items={[
          {
            key: "modules",
            label: tx("moduleList", "Modullar ro‘yxati"),
            children: (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
                {filtered.map((d) => {
                  const pr = previews[d.key];
                  const HasComp = pr?.component;

                  return (
                    <Card key={d.key} size="small" title={<span>{d.title} <Text type="secondary">({d.kind})</Text></span>}>
                      <Space direction="vertical" style={{ width: "100%" }}>
                        <Button onClick={() => onPreview(d)}>
                          Load / Smoke
                        </Button>

                        {pr?.ok === false && (
                          <Alert type="error" showIcon message={String(pr?.error?.message || pr?.error || "Error")} />
                        )}

                        {HasComp && (
                          <div style={{ border: "1px dashed #ddd", padding: 12, borderRadius: 8 }}>
                            <Text type="secondary">Preview:</Text>
                            <Divider style={{ margin: "8px 0" }} />
                            <HasComp />
                          </div>
                        )}

                        {pr?.ok === true && !HasComp && (
                          <Text type="secondary">
                            Loaded. (No preview)
                          </Text>
                        )}
                      </Space>
                    </Card>
                  );
                })}
              </div>
            ),
          },
          {
            key: "logs",
            label: "Log",
            children: (
              <div style={{ maxHeight: 320, overflow: "auto", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontSize: 12 }}>
                {logs.length === 0 ? (
                  <Text type="secondary">{tx("noLogs", "Hali log yo‘q.")}</Text>
                ) : (
                  logs.map((l, i) => (
                    <div key={i}>
                      <Text type="secondary">{l.t}</Text> — <Text>{l.line}</Text>
                    </div>
                  ))
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}