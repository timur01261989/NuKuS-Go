export const appConfig = {
  features: {
    offlineTiles: true,
    telemetry: true,
    lottie: true,
    searchOnRoute: true, // enable when wired to map + POI source
    payments: true,
    garage: true,
    chat: true,
  },
};


// Optional: sync feature flags from /config/ui.json at runtime (GIS-level config).
// If you never call this, nothing changes.
export async function syncFeaturesFromUiConfig() {
  try {
    const { getUiRuntimeConfig } = await import('./runtimeConfig.js');
    const ui = await getUiRuntimeConfig();
    if (ui?.features) {
      appConfig.features = { ...appConfig.features, ...ui.features };
    }
  } catch {
    // ignore
  }
}
