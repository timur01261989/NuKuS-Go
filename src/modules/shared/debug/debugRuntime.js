let installed = false;

function logError(kind, error, extra = {}) {
  try {
    console.error(`[debugRuntime:${kind}]`, error, extra);
  } catch {
    // ignore console errors in restricted environments
  }
}

export function installGlobalDebugRuntime() {
  if (installed || typeof window === 'undefined') {
    return;
  }
  installed = true;

  window.addEventListener('error', (event) => {
    logError('error', event?.error || event?.message || event, {
      filename: event?.filename,
      lineno: event?.lineno,
      colno: event?.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logError('unhandledrejection', event?.reason || event);
  });
}

export default installGlobalDebugRuntime;
