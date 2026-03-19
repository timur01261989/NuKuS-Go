// server/_shared/antiFraud.js
// NOTE: This is a lightweight start. Real anti-fraud is behavioral + device + network checks.
export function riskFlags({ device_id, app_version, lat, lng }) {
  const flags = [];
  if (!device_id) flags.push('missing_device_id');
  if (!app_version) flags.push('missing_app_version');
  if (typeof lat !== 'number' || typeof lng !== 'number') flags.push('missing_location');
  return flags;
}