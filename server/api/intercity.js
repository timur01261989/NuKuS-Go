import { applyCors, json, badRequest, serverError } from '../_shared/cors.js';
import { getSupabaseAdmin, getAuthedUserId } from '../_shared/supabase.js';
import { enrichTripsWithCorridorScore } from '../../backend/src/trips/corridorMatcher.js';
import { createSeatHold, pushWaitlist, getTripInventorySnapshot, releaseSeatHold } from '../../backend/src/trips/seatInventoryService.js';
import { rankTrips } from '../../backend/src/trips/tripRankingService.js';
import { saveRecurringTemplate, listRecurringTemplates } from '../../backend/src/trips/recurringTripService.js';

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf-8') || '{}');
  } catch {
    return {};
  }
}

async function listOffers(sb, body) {
  const fromRegion = String(body.from_city || body.from_region || '').trim();
  const toRegion = String(body.to_city || body.to_region || '').trim();
  const departDate = String(body.date || body.depart_date || '').trim();

  let query = sb
    .from('interprov_trips')
    .select('*')
    .in('status', ['active', 'draft'])
    .order('depart_at', { ascending: true })
    .limit(50);

  if (fromRegion) query = query.eq('from_region', fromRegion);
  if (toRegion) query = query.eq('to_region', toRegion);
  if (departDate) {
    query = query.gte('depart_at', `${departDate}T00:00:00`).lte('depart_at', `${departDate}T23:59:59`);
  }

  const { data, error } = await query;
  if (error) throw error;

  const enriched = enrichTripsWithCorridorScore(data || [], {
    origin: body.from_point,
    destination: body.to_point,
  }).map((trip) => ({
    ...trip,
    inventory: getTripInventorySnapshot(trip, trip.booked_seats || 0),
    available_seats: getTripInventorySnapshot(trip, trip.booked_seats || 0).availableSeats,
    amenities: {
      has_ac: !!trip.has_ac,
      has_trunk: !!trip.has_trunk,
      wifi: !!trip.wifi,
      charger: !!trip.charger,
      refreshments: !!trip.refreshments,
      wheelchair_accessible: !!trip.wheelchair_accessible,
    },
  }));

  return { ok: true, offers: rankTrips(enriched) };
}

async function requestBooking(req, sb, body) {
  const userId = await getAuthedUserId(req, sb);
  if (!userId) return { ok: false, error: 'Login qiling' };

  const offerId = String(body.offer_id || body.trip_id || '').trim();
  if (!offerId) return { ok: false, error: 'offer_id kerak' };

  const { data: trip, error } = await sb.from('interprov_trips').select('*').eq('id', offerId).maybeSingle();
  if (error) throw error;
  if (!trip) return { ok: false, error: 'Trip topilmadi' };

  const seats = Math.max(1, Number(body.seats || 1));
  const holdResult = createSeatHold({ trip, bookingUserId: userId, seats, bookedSeats: trip.booked_seats || 0 });
  if (!holdResult.ok) {
    const waitResult = pushWaitlist({ tripId: offerId, userId, seats, payload: body });
    return { ok: false, waitlisted: true, waitlist: waitResult.entry, error: 'Joy qolmagan, waitlist ga qo‘shildi' };
  }

  const payload = {
    trip_id: offerId,
    client_user_id: userId,
    seats,
    status: 'held',
    hold_id: holdResult.hold.holdId,
    notes: body.notes || null,
    updated_at: new Date().toISOString(),
  };

  const inserted = await sb.from('inter_prov_seat_requests').insert(payload).select('*').maybeSingle();
  if (inserted.error) {
    releaseSeatHold({ tripId: offerId, holdId: holdResult.hold.holdId });
    throw inserted.error;
  }

  return { ok: true, booking: inserted.data, hold: holdResult.hold };
}

async function myBookings(req, sb) {
  const userId = await getAuthedUserId(req, sb);
  if (!userId) return { ok: true, bookings: [] };
  const { data, error } = await sb.from('inter_prov_seat_requests').select('*').eq('client_user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return { ok: true, bookings: data || [] };
}

async function cancelBooking(req, sb, body) {
  const userId = await getAuthedUserId(req, sb);
  if (!userId) return { ok: false, error: 'Login qiling' };
  const bookingId = String(body.booking_id || '').trim();
  if (!bookingId) return { ok: false, error: 'booking_id kerak' };

  const { data: booking, error } = await sb
    .from('inter_prov_seat_requests')
    .select('*')
    .eq('id', bookingId)
    .eq('client_user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!booking) return { ok: false, error: 'Booking topilmadi' };

  const update = await sb
    .from('inter_prov_seat_requests')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', bookingId)
    .select('*')
    .maybeSingle();

  if (update.error) throw update.error;
  if (booking.hold_id) releaseSeatHold({ tripId: booking.trip_id, holdId: booking.hold_id });
  return { ok: true, booking: update.data };
}

async function recurringTemplate(req, sb, body) {
  const userId = await getAuthedUserId(req, sb);
  if (!userId) return { ok: false, error: 'Login qiling' };
  if (body.action === 'save_recurring_template') {
    return { ok: true, template: saveRecurringTemplate({ ...body.template, driver_id: userId }) };
  }
  return { ok: true, templates: listRecurringTemplates(userId) };
}

export default async function handler(req, res) {
  applyCors(req, res);
  if (req.method === 'OPTIONS') return json(res, 204, { ok: true });
  if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'Method not allowed' });

  try {
    const body = await readBody(req);
    const sb = getSupabaseAdmin();
    let out = null;

    switch (body.action) {
      case 'list_offers':
        out = await listOffers(sb, body);
        break;
      case 'request_booking':
        out = await requestBooking(req, sb, body);
        break;
      case 'my_bookings':
        out = await myBookings(req, sb);
        break;
      case 'cancel_booking':
        out = await cancelBooking(req, sb, body);
        break;
      case 'save_recurring_template':
      case 'list_recurring_templates':
        out = await recurringTemplate(req, sb, body);
        break;
      default:
        return badRequest(res, 'Noma’lum action');
    }

    return json(res, 200, out);
  } catch (error) {
    return serverError(res, error);
  }
}
