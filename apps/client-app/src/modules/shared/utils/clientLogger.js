function sanitize(value) {
  if (Array.isArray(value)) return value.map(sanitize);
  if (!value || typeof value !== "object") return value;
  const out = {};
  for (const [key, inner] of Object.entries(value)) {
    const lowered = String(key).toLowerCase();
    if (["token", "password", "otp", "code", "authorization", "cookie", "secret", "signature"].includes(lowered)) {
      out[key] = "[redacted]";
    } else {
      out[key] = sanitize(inner);
    }
  }
  return out;
}

function emit(level, event, meta = {}) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    event,
    ...sanitize(meta),
  };
  if (level === "error") {
    console.error(payload);
    return;
  }
  if (level === "warn") {
    console.warn(payload);
    return;
  }
  console.info(payload);
}

export const clientLogger = {
  info(event, meta) {
    emit("info", event, meta);
  },
  warn(event, meta) {
    emit("warn", event, meta);
  },
  error(event, meta) {
    emit("error", event, meta);
  },
};

export default clientLogger;
