const templates = globalThis.__UNIGO_RECURRING_TRIP_TEMPLATES__ || (globalThis.__UNIGO_RECURRING_TRIP_TEMPLATES__ = new Map());

function templateKey(template) {
  return String(template?.id || template?.templateId || '').trim();
}

export function saveRecurringTemplate(template) {
  const id = templateKey(template) || `tpl_${Date.now()}`;
  const payload = {
    ...template,
    id,
    recurrence: template?.recurrence || 'weekly',
    weekdays: Array.isArray(template?.weekdays) ? template.weekdays : [],
    departure_time: template?.departure_time || '07:00',
    is_active: template?.is_active !== false,
    updated_at: new Date().toISOString(),
  };
  templates.set(id, payload);
  return payload;
}

export function listRecurringTemplates(driverId = null) {
  const rows = Array.from(templates.values());
  if (!driverId) return rows;
  return rows.filter((row) => String(row.driver_id || '') === String(driverId));
}

function combineDateAndTime(date, time) {
  const dt = new Date(date);
  const [hh, mm] = String(time || '07:00').split(':').map((v) => Number(v || 0));
  dt.setHours(hh, mm, 0, 0);
  return dt;
}

export function generateOccurrences(template, { fromDate = new Date(), daysAhead = 14 } = {}) {
  const item = saveRecurringTemplate(template);
  const out = [];
  const start = new Date(fromDate);
  const end = new Date(start.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const weekday = cursor.getDay();
    if (item.recurrence === 'daily' || item.weekdays.includes(weekday)) {
      out.push({
        template_id: item.id,
        driver_id: item.driver_id || null,
        depart_at: combineDateAndTime(cursor, item.departure_time).toISOString(),
        from_region: item.from_region || null,
        to_region: item.to_region || null,
        from_district: item.from_district || null,
        to_district: item.to_district || null,
        seats_total: item.seats_total ?? item.seats ?? null,
        base_price_uzs: item.base_price_uzs ?? item.price ?? 0,
      });
    }
  }
  return out;
}
