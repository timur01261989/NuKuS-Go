const SENSITIVE_KEYS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "password",
  "otp",
  "code",
  "token",
  "secret",
  "signature",
  "sign_string",
]);

function sanitizeValue(value) {
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (!value || typeof value !== "object") return value;
  const out = {};
  for (const [key, inner] of Object.entries(value)) {
    if (SENSITIVE_KEYS.has(String(key).toLowerCase())) {
      out[key] = "[redacted]";
    } else {
      out[key] = sanitizeValue(inner);
    }
  }
  return out;
}

function log(level, event, meta = {}) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    event,
    ...sanitizeValue(meta),
  };
  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.log(line);
}

export const logger = {
  info(event, meta) {
    log("info", event, meta);
  },
  warn(event, meta) {
    log("warn", event, meta);
  },
  error(event, meta) {
    log("error", event, meta);
  },
};

export default logger;
