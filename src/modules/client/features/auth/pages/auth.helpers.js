export function normalizePhoneInput(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 9);
  let out = digits;
  if (digits.length > 2) out = `${digits.slice(0, 2)} ${digits.slice(2)}`;
  if (digits.length > 5) out = `${out.slice(0, 6)} ${digits.slice(5)}`;
  if (digits.length > 7) out = `${out.slice(0, 9)} ${digits.slice(7)}`;
  return out;
}

export function formatUzPhone(rawPhone) {
  let digits = String(rawPhone || '').replace(/\D/g, '');
  if (digits.length === 9) digits = `998${digits}`;
  if (!digits.startsWith('998')) digits = `998${digits}`;
  digits = digits.slice(0, 12);
  return `+${digits}`;
}

export function getSuggestedPhoneFromLocation(location) {
  try {
    return location?.state?.suggestedPhone || '';
  } catch {
    return '';
  }
}
