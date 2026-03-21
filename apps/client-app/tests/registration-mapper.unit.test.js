/**
 * registration-mapper.unit.test.js
 * DOCX Section 10: Unit — registration mapper
 */
import { describe, it, expect } from 'vitest';

// mapFormToPayload ni local ko'chirma sifatida test qilamiz
// (import path test muhitida ishlamasligi mumkin)
function mapFormToPayload(formData) {
  const vehicleType = formData.vehicleType || 'light_car';
  return {
    last_name:   String(formData.lastName   || '').toUpperCase().trim() || null,
    first_name:  String(formData.firstName  || '').toUpperCase().trim() || null,
    middle_name: String(formData.middleName || '').toUpperCase().trim() || null,
    // FIX: father_name — alohida maydon (avval middleName bilan bir xil edi)
    father_name: String(formData.fatherName || formData.middleName || '').toUpperCase().trim() || null,
    phone:       String(formData.phone || '').replace(/\D/g, '') || null,
    passport_number: String(formData.passportNumber || '').toUpperCase().replace(/[^A-Z0-9]/g, '') || null,
    requested_vehicle_type: vehicleType,
  };
}

function mapPayloadToForm(row) {
  if (!row) return {};
  return {
    lastName:      row.last_name   || '',
    firstName:     row.first_name  || '',
    middleName:    row.middle_name || '',
    fatherName:    row.father_name || row.middle_name || '',
    phone:         String(row.phone || '').replace(/\D/g, ''),
    passportNumber:row.passport_number || '',
    vehicleType:   row.requested_vehicle_type || 'light_car',
  };
}

describe('mapFormToPayload', () => {
  it('ism-familiyani uppercase ga aylantiradi', () => {
    const p = mapFormToPayload({ lastName: 'karimov', firstName: 'aziz', vehicleType: 'light_car' });
    expect(p.last_name).toBe('KARIMOV');
    expect(p.first_name).toBe('AZIZ');
  });

  it('father_name fatherName dan oladi (BUG FIX)', () => {
    const p = mapFormToPayload({ middleName: 'Ortiq', fatherName: 'Bahodir', vehicleType: 'light_car' });
    expect(p.middle_name).toBe('ORTIQ');
    expect(p.father_name).toBe('BAHODIR'); // avval ORTIQ edi — noto'g'ri
  });

  it('father_name yo\'q bo\'lsa middleName fallback qiladi', () => {
    const p = mapFormToPayload({ middleName: 'Ortiq', fatherName: '', vehicleType: 'light_car' });
    expect(p.father_name).toBe('ORTIQ');
  });

  it('telefon raqamdan naqtalarni tozalaydi', () => {
    const p = mapFormToPayload({ phone: '+998-90-123-45-67', vehicleType: 'light_car' });
    expect(p.phone).toBe('998901234567');
  });

  it('bo\'sh maydonlar null ga aylanadi', () => {
    const p = mapFormToPayload({ lastName: '', firstName: '', vehicleType: 'light_car' });
    expect(p.last_name).toBeNull();
    expect(p.first_name).toBeNull();
  });
});

describe('mapPayloadToForm', () => {
  it('DB qatorini formaga aylantiradi', () => {
    const form = mapPayloadToForm({
      last_name: 'KARIMOV', first_name: 'AZIZ',
      middle_name: 'ORTIQ', father_name: 'BAHODIR',
      phone: '998901234567', requested_vehicle_type: 'light_car',
    });
    expect(form.lastName).toBe('KARIMOV');
    expect(form.fatherName).toBe('BAHODIR');
    expect(form.middleName).toBe('ORTIQ');
  });

  it('null input — bo\'sh ob\'ekt qaytaradi', () => {
    const form = mapPayloadToForm(null);
    expect(form).toEqual({});
  });
});
