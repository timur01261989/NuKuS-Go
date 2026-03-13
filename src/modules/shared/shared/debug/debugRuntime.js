function safeCloneError(input) {
  if (!input) return input;
  if (input instanceof Error) {
    return {
      name: input.name,
      message: input.message,
      stack: input.stack,
      cause: input.cause,
    };
  }
  try {
    return JSON.parse(JSON.stringify(input));
  } catch {
    return String(input);
  }
}

function getStorageSnapshot() {
  if (typeof window === "undefined") return {};

  const snapshot = {
    localStorage: {},
    sessionStorage: {},
  };

  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      if (/supabase|sb-|auth|token/i.test(key)) {
        snapshot.localStorage[key] = window.localStorage.getItem(key);
      }
    }
  } catch (error) {
    snapshot.localStorageError = safeCloneError(error);
  }

  try {
    for (let i = 0; i < window.sessionStorage.length; i += 1) {
      const key = window.sessionStorage.key(i);
      if (!key) continue;
      if (/supabase|sb-|auth|token/i.test(key)) {
        snapshot.sessionStorage[key] = window.sessionStorage.getItem(key);
      }
    }
  } catch (error) {
    snapshot.sessionStorageError = safeCloneError(error);
  }

  return snapshot;
}

export function installGlobalDebugRuntime() {
  if (typeof window === "undefined") return;
  if (window.__UNIGO_DEBUG_RUNTIME_INSTALLED__) return;

  window.__UNIGO_DEBUG_RUNTIME_INSTALLED__ = true;

  window.addEventListener("error", (event) => {
    console.error("[GLOBAL_ERROR]", {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: safeCloneError(event.error),
      href: window.location.href,
      pathname: window.location.pathname,
      storage: getStorageSnapshot(),
      at: new Date().toISOString(),
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    console.error("[UNHANDLED_PROMISE]", {
      reason: safeCloneError(event.reason),
      href: window.location.href,
      pathname: window.location.pathname,
      storage: getStorageSnapshot(),
      at: new Date().toISOString(),
    });
  });

  const originalFetch = window.fetch?.bind(window);
  if (originalFetch) {
    window.fetch = async (...args) => {
      const startedAt = Date.now();
      const requestUrl = typeof args[0] === "string" ? args[0] : args[0]?.url;
      try {
        const response = await originalFetch(...args);
        if (!response.ok) {
          console.error("[FETCH_NON_OK]", {
            url: requestUrl,
            status: response.status,
            statusText: response.statusText,
            elapsedMs: Date.now() - startedAt,
            pathname: window.location.pathname,
          });
        }
        return response;
      } catch (error) {
        console.error("[FETCH_FAILED]", {
          url: requestUrl,
          elapsedMs: Date.now() - startedAt,
          error: safeCloneError(error),
          pathname: window.location.pathname,
        });
        throw error;
      }
    };
  }

  console.log("[DEBUG_RUNTIME] installed", {
    href: window.location.href,
    pathname: window.location.pathname,
    at: new Date().toISOString(),
  });
}
