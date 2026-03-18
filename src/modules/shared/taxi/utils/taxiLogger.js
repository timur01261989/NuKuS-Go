function emit(level, message, meta = {}) {
  const payload = {
    scope: "taxi",
    level,
    message,
    meta,
    at: new Date().toISOString(),
  };

  if (typeof console !== "undefined") {
    const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.info;
    fn("[taxi]", message, meta);
  }

  try {
    if (typeof window !== "undefined") {
      const buffer = Array.isArray(window.__taxiLogs) ? window.__taxiLogs : [];
      buffer.push(payload);
      window.__taxiLogs = buffer.slice(-50);
    }
  } catch {
    // noop
  }

  return payload;
}

export const taxiLogger = {
  info(message, meta) {
    return emit("info", message, meta);
  },
  warn(message, meta) {
    return emit("warn", message, meta);
  },
  error(message, meta) {
    return emit("error", message, meta);
  },
};

export default taxiLogger;
