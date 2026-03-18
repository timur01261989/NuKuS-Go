/**
 * mappers.js — Driver registration form ↔ backend payload mapperlari
 *
 * DOCX tavsiyasi: Canonical registration schema va mapper kiriting.
 * Schema drift oldini olish uchun barcha mapping shu faylda bo'ladi.
 *
 * TUZATILGAN: father_name/middle_name duplicate bug mana shu mapper orqali
 * boshqariladi — form dagi fatherName va middleName alohida maydonlar.
 */

/**
 * Forma ma'lumotlarini DB payload ga aylantiradi.
 * @param {object} formData
 * @returns {object} — driver_applications ga insert qilish uchun tayyor ob'ekt
 */
export function mapFormToPayload(formData) {
  const vehicleType   = formData.vehicleType || 'light_car';
  return {
    last_name:   norm(formData.lastName),
    first_name:  norm(formData.firstName),
    // FIX: middle_name va father_name alohida manbalarda
    middle_name: norm(formData.middleName),
    father_name: norm(formData.fatherName || formData.middleName), // patronimik
    phone:       String(formData.phone || '').replace(/\D/g, '') || null,
    passport_number: String(formData.passportNumber || '').toUpperCase().replace(/[^A-Z0-9]/g, '') || null,
    requested_vehicle_type:  vehicleType,
    transport_type:          toLegacyTransport(vehicleType),
    vehicle_brand:           formData.brand  || null,
    vehicle_model:           formData.model  || null,
    vehicle_plate:           String(formData.plateNumber || '').toUpperCase().replace(/[^A-Z0-9]/g, '') || null,
    vehicle_year:            toInt(formData.year),
    vehicle_color:           formData.color  || null,
    seat_count:              toInt(formData.seats),
    requested_max_freight_weight_kg: toFloat(formData.cargoKg),
    requested_payload_volume_m3:     toFloat(formData.cargoM3),
  };
}

/**
 * DB qatorini forma state ga aylantiradi (redaktirash uchun yuklash).
 * @param {object} row — driver_applications qatori
 * @returns {object} — forma state
 */
export function mapPayloadToForm(row) {
  if (!row) return {};
  return {
    lastName:      row.last_name   || '',
    firstName:     row.first_name  || '',
    // FIX: ikkala maydon alohida manbadan
    middleName:    row.middle_name || '',
    fatherName:    row.father_name || row.middle_name || '',
    phone:         String(row.phone || '').replace(/\D/g, ''),
    passportNumber:row.passport_number || '',
    vehicleType:   row.requested_vehicle_type || 'light_car',
    brand:         row.vehicle_brand  || '',
    model:         row.vehicle_model  || '',
    plateNumber:   row.vehicle_plate  || '',
    year:          row.vehicle_year   ? String(row.vehicle_year) : '',
    color:         row.vehicle_color  || '',
    seats:         row.seat_count     ? String(row.seat_count)   : '',
    cargoKg:       row.requested_max_freight_weight_kg ? String(row.requested_max_freight_weight_kg) : '',
    cargoM3:       row.requested_payload_volume_m3     ? String(row.requested_payload_volume_m3)     : '',
  };
}

// ── Ichki yordamchilar ────────────────────────────────────────────────────────
function norm(v)    { return String(v || '').toUpperCase().trim() || null; }
function toInt(v)   { if (!v && v !== 0) return null; const n = parseInt(v, 10);  return isNaN(n) ? null : n; }
function toFloat(v) { if (!v && v !== 0) return null; const n = parseFloat(v);    return isNaN(n) ? null : n; }

function toLegacyTransport(vehicleType) {
  const MAP = {
    light_car:  'taxi',
    minivan:    'minivan',
    truck:      'truck',
    motorcycle: 'motorcycle',
  };
  return MAP[vehicleType] || 'taxi';
}
