// server/_shared/logger.js
export function log(level, msg, meta) {
  const entry = { level, msg, ...((meta && typeof meta === 'object') ? { meta } : {}), ts: new Date().toISOString() };
  // In Vercel, console logs are your primary store; later ship to Logtail/Sentry/etc.
  if (level === 'error') console.error(JSON.stringify(entry));
  else if (level === 'warn') console.warn(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}