import { supabase } from '@/lib/supabase';

// Jadval nomlari (Loyihangizga moslab olingan)
const TBL_QUEUE = 'queues';
const TBL_REQUESTS = 'district_requests';
const TBL_LOCATIONS = 'locations';
const TBL_TRIPS = 'inter_district_trips'; // Reyslar saqlanadigan asosiy jadval

/**
 * upsertDriverLocation
 * Haydovchining joriy koordinatalari va rejimini yangilash
 */
export async function upsertDriverLocation({ driver_id, lat, lng, mode }) {
  if (!supabase) throw new Error('Supabase client topilmadi');
  const payload = { 
    driver_id, 
    lat, 
    lng, 
    mode, 
    updated_at: new Date().toISOString() 
  };
  return supabase.from(TBL_LOCATIONS).upsert(payload, { onConflict: 'driver_id' });
}

/**
 * createInterDistrictTrip
 * Yangi reys yaratish (Unified Trip Model)
 * Eltish, Yuk va Ayollar rejimi maydonlari qo'shildi
 */
export async function createInterDistrictTrip(data) {
  if (!supabase) throw new Error('Supabase client topilmadi');
  
  const payload = {
    driver_id: data.driver_id,
    from_district: data.from_district,
    to_district: data.to_district,
    depart_at: data.depart_at,
    tariff: data.tariff, // 'door' yoki 'pitak'
    base_price_uzs: data.base_price_uzs,
    pickup_fee_uzs: data.pickup_fee_uzs || 0,
    dropoff_fee_uzs: data.dropoff_fee_uzs || 0,
    seats_total: data.seats_total || 4,
    allow_full_salon: data.allow_full_salon || false,
    full_salon_price_uzs: data.full_salon_price_uzs || null,
    
    // Yangi xizmatlar (Eltish va Yuk)
    has_eltish: data.has_eltish || false,
    eltish_price_uzs: data.has_eltish ? data.eltish_price_uzs : null,
    has_yuk: data.has_yuk || false,
    yuk_price_uzs: data.has_yuk ? data.yuk_price_uzs : null,
    
    // Gender va Qulayliklar
    female_only: data.female_only || false,
    has_ac: data.has_ac || false,
    has_trunk: data.has_trunk || false,
    is_lux: data.is_lux || false,
    
    notes: data.notes || '',
    status: 'active',
    created_at: new Date().toISOString()
  };

  const { data: result, error } = await supabase
    .from(TBL_TRIPS)
    .insert([payload])
    .select();

  if (error) throw error;
  return result;
}

/**
 * joinQueue
 * Pitak (Standard) rejimida navbatga turish
 */
export async function joinQueue({ driver_id, zone = 'NUKUS_AVTOVOKZAL' }) {
  if (!supabase) throw new Error('Supabase client topilmadi');
  return supabase.from(TBL_QUEUE).insert([{ 
    driver_id, 
    zone, 
    created_at: new Date().toISOString() 
  }]);
}

/**
 * getQueuePosition
 * Navbatdagi o'rinni aniqlash
 */
export async function getQueuePosition({ driver_id, zone = 'NUKUS_AVTOVOKZAL' }) {
  if (!supabase) throw new Error('Supabase client topilmadi');
  const { data, error } = await supabase
    .from(TBL_QUEUE)
    .select('id, driver_id, created_at')
    .eq('zone', zone)
    .order('created_at', { ascending: true });
    
  if (error) throw error;
  
  const idx = (data || []).findIndex((x) => x.driver_id === driver_id);
  return { 
    position: idx >= 0 ? idx + 1 : null, 
    total: (data || []).length 
  };
}

/**
 * listPremiumRequests
 * Premium (Door-to-door) rejimdagi yangi so'rovlarni olish
 */
export async function listPremiumRequests() {
  if (!supabase) throw new Error('Supabase client topilmadi');
  return supabase
    .from(TBL_REQUESTS)
    .select('*')
    .in('status', ['new', 'pending'])
    .order('created_at', { ascending: false });
}

/**
 * listDriverRequests
 * Haydovchining o'ziga kelgan barcha so'rovlarni (Eltish/Yuk/Yo'lovchi) yuklash
 */
export async function listDriverRequests({ limit = 100 } = {}) {
  if (!supabase) throw new Error('Supabase client topilmadi');
  const { data, error } = await supabase
    .from(TBL_REQUESTS)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
    
  if (error) throw error;
  return data;
}

/**
 * acceptRequest
 * Kelgan so'rovni qabul qilish
 */
export async function acceptRequest({ request_id, driver_id }) {
  if (!supabase) throw new Error('Supabase client topilmadi');
  return supabase
    .from(TBL_REQUESTS)
    .update({ 
      status: 'accepted', 
      driver_id, 
      accepted_at: new Date().toISOString() 
    })
    .eq('id', request_id);
}

/**
 * respondTripRequest
 * So'rovga umumiy javob berish (Accepted / Rejected)
 */
export async function respondTripRequest(requestId, status) {
  if (!supabase) throw new Error('Supabase client topilmadi');
  const { data, error } = await supabase
    .from(TBL_REQUESTS)
    .update({ 
      status, 
      responded_at: new Date().toISOString() 
    })
    .eq('id', requestId);
    
  if (error) throw error;
  return data;
}

/**
 * declineRequest
 * So'rovni rad etish
 */
export async function declineRequest({ request_id, driver_id }) {
  if (!supabase) throw new Error('Supabase client topilmadi');
  return supabase
    .from(TBL_REQUESTS)
    .update({ 
      status: 'rejected', 
      driver_id, 
      rejected_at: new Date().toISOString() 
    })
    .eq('id', request_id);
}