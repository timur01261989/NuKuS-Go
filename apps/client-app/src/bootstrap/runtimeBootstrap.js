import { installGlobalDebugRuntime } from "@/modules/shared/debug/debugRuntime.js";
import { assertClientEnv } from "@/config/env.js";
import { setupNotifications } from "@/services/notifications.js";
import { installLegacyAuthTokenBridge } from "@/services/auth/legacyTokenBridge.js";

let cleanup = null;
let started = false;

export function bootstrapRuntime() {
  if (started) {
    return cleanup || (() => {});
  }

  started = true;
  installGlobalDebugRuntime();

  try {
    assertClientEnv();
  } catch (error) {
    console.error("[runtimeBootstrap] client env validation failed", error);
  }

  cleanup = installLegacyAuthTokenBridge();

  Promise.resolve()
    .then(() => setupNotifications())
    .catch((error) => {
      if (import.meta.env.DEV) {
        console.warn("[runtimeBootstrap] notifications bootstrap skipped", error?.message || error);
      }
    });

  return cleanup || (() => {});
}
