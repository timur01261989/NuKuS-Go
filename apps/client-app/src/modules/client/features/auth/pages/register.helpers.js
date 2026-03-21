export function normalizePhoneInput(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 9);
  let out = digits;
  if (digits.length > 2) out = `${digits.slice(0, 2)} ${digits.slice(2)}`;
  if (digits.length > 5) out = `${out.slice(0, 6)} ${digits.slice(5)}`;
  if (digits.length > 7) out = `${out.slice(0, 9)} ${digits.slice(7)}`;
  return out;
}

export function toFullPhone(localDigits) {
  const digits = String(localDigits || '').replace(/\D/g, '');
  if (digits.length !== 9) return null;
  return `+998${digits}`;
}

export function buildFullName(name, surname, tr) {
  const safeName = String(name || '').trim() || tr('register.unknownName', 'Noma’lum');
  const safeSurname = String(surname || '').trim() || tr('register.userSurnameFallback', 'Foydalanuvchi');
  return `${safeName} ${safeSurname}`.trim();
}

