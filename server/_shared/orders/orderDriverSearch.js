function toFinite(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function haversineKm(aLat, aLng, bLat, bLng) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s1 = Math.sin(dLat / 2) ** 2;
  const s2 = Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s1 + s2));
}

function normalizeServiceType(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'intercity') return 'inter_city';
  if (raw === 'interdistrict') return 'inter_district';
  return raw || 'taxi';
}

function normalizeServiceScope(serviceType, explicitScope = null) {
  const scope = String(explicitScope || '').trim().toLowerCase();
  if (scope === 'city' || scope === 'intercity' || scope === 'interdistrict') return scope;
  const normalizedType = normalizeServiceType(serviceType);
  if (normalizedType === 'inter_city') return 'intercity';
  if (normalizedType === 'inter_district') return 'interdistrict';
  return 'city';
}

function deriveOrderType(serviceType) {
  const normalizedType = normalizeServiceType(serviceType);
  if (normalizedType === 'delivery') return 'delivery';
  if (normalizedType === 'freight') return 'freight';
  return 'passenger';
}

function getCapabilityFlag(serviceScope, orderType) {
  const safeScope = normalizeServiceScope(null, serviceScope);
  const safeType = String(orderType || 'passenger').trim().toLowerCase();
  if (!safeScope || !safeType) return null;
  return `${safeScope}_${safeType}`;
}

function driverSupportsCapability(settings = {}, capabilityFlag = '') {
  if (!capabilityFlag) return true;
  return !!settings[capabilityFlag];
}

function rowToSettingsMap(row = {}) {
  return {
    city_passenger: !!row.city_passenger,
    city_delivery: !!row.city_delivery,
    city_freight: !!row.city_freight,
    intercity_passenger: !!row.intercity_passenger,
    intercity_delivery: !!row.intercity_delivery,
    intercity_freight: !!row.intercity_freight,
    interdistrict_passenger: !!row.interdistrict_passenger,
    interdistrict_delivery: !!row.interdistrict_delivery,
    interdistrict_freight: !!row.interdistrict_freight,
  };
}

function normalizeVehicle(row = {}) {
  return {
    id: row.id || null,
    user_id: row.user_id || row.driver_id || null,
    vehicle_type: row.vehicle_type || row.requested_vehicle_type || row.transport_type || row.body_type || 'light_car',
    seat_count: toFinite(row.seat_count ?? row.seats, 0),
    max_weight_kg: toFinite(row.max_weight_kg ?? row.capacity_kg ?? row.requested_max_freight_weight_kg, 0),
    max_volume_m3: toFinite(row.max_volume_m3 ?? row.capacity_m3 ?? row.requested_payload_volume_m3, 0),
    approval_status: String(row.approval_status || row.status || 'approved').trim().toLowerCase(),
    is_active: !!row.is_active,
    updated_at: row.updated_at || row.created_at || null,
  };
}

function canVehicleHandleOrder(vehicle = {}, orderContext = {}) {
  const orderType = deriveOrderType(orderContext.serviceType);
  const passengerCount = Math.max(0, toFinite(orderContext.passengerCount, 0));
  const cargoWeightKg = Math.max(0, toFinite(orderContext.cargoWeightKg, 0));
  const cargoVolumeM3 = Math.max(0, toFinite(orderContext.cargoVolumeM3, 0));

  if (vehicle.approval_status !== 'approved') return false;

  if (orderType === 'passenger') {
    if (!passengerCount) return true;
    return passengerCount <= Math.max(1, toFinite(vehicle.seat_count, 0));
  }

  const maxWeight = Math.max(0, toFinite(vehicle.max_weight_kg, 0));
  const maxVolume = Math.max(0, toFinite(vehicle.max_volume_m3, 0));

  if (orderType === 'delivery') {
    const weightOk = !cargoWeightKg || maxWeight === 0 || cargoWeightKg <= maxWeight;
    const volumeOk = !cargoVolumeM3 || maxVolume === 0 || cargoVolumeM3 <= maxVolume;
    return weightOk && volumeOk;
  }

  if (orderType === 'freight') {
    if (maxWeight <= 0 && maxVolume <= 0) return false;
    const weightOk = !cargoWeightKg || cargoWeightKg <= maxWeight;
    const volumeOk = !cargoVolumeM3 || cargoVolumeM3 <= maxVolume;
    return weightOk && volumeOk;
  }

  return true;
}

async function fetchVehicleRows(supabase, driverIds = []) {
  const safeIds = [...new Set((driverIds || []).filter(Boolean).map(String))];
  if (!safeIds.length) return [];

  const requests = [
    () => supabase
      .from('vehicles')
      .select('id,user_id,driver_id,vehicle_type,requested_vehicle_type,transport_type,body_type,seat_count,seats,max_weight_kg,capacity_kg,requested_max_freight_weight_kg,max_volume_m3,capacity_m3,requested_payload_volume_m3,approval_status,status,is_active,created_at,updated_at')
      .or(`user_id.in.(${safeIds.join(',')}),driver_id.in.(${safeIds.join(',')})`)
      .order('is_active', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(Math.max(safeIds.length * 4, 50)),
    () => supabase
      .from('vehicles')
      .select('id,user_id,vehicle_type,seat_count,max_weight_kg,max_volume_m3,approval_status,is_active,created_at,updated_at')
      .in('user_id', safeIds)
      .order('is_active', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(Math.max(safeIds.length * 4, 50)),
    () => supabase
      .from('vehicles')
      .select('*')
      .in('user_id', safeIds)
      .order('created_at', { ascending: false })
      .limit(Math.max(safeIds.length * 4, 50)),
  ];

  let lastError = null;
  for (const run of requests) {
    const result = await run();
    if (!result.error) return Array.isArray(result.data) ? result.data : [];
    lastError = result.error;
    const msg = String(result.error.message || '').toLowerCase();
    if (!msg.includes('column') && !msg.includes('does not exist')) throw result.error;
  }

  if (lastError) throw lastError;
  return [];
}

function computeDispatchScore(candidate = {}, orderContext = {}) {
  const distanceKm = Math.max(0, toFinite(candidate.dist_km, 9999));
  const freshnessMinutes = Math.max(0, toFinite(candidate.freshness_minutes, 9999));
  const capabilityBoost = Math.max(0, toFinite(candidate.capability_score, 0));
  const affinityBoost = candidate.active_service_type && normalizeServiceType(candidate.active_service_type) === normalizeServiceType(orderContext.serviceType)
    ? 8
    : 2;
  const distanceScore = Math.max(0, 60 - (distanceKm * 10));
  const freshnessScore = Math.max(0, 20 - freshnessMinutes);
  return Number((distanceScore + freshnessScore + capabilityBoost + affinityBoost).toFixed(4));
}

async function findDriversViaRpc({ supabase, orderContext, radiusMeters, limit, excludedDriverIds }) {
  const { data, error } = await supabase.rpc('dispatch_match_order', {
    p_order_id: orderContext.orderId,
    p_limit: limit,
    p_radius_km: Number((radiusMeters / 1000).toFixed(3)),
    p_excluded_driver_ids: excludedDriverIds,
  });
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

async function findDriversViaFallback({ supabase, orderContext, radiusMeters, limit, excludedDriverIds }) {
  const excluded = new Set((excludedDriverIds || []).filter(Boolean).map(String));
  const capabilityFlag = getCapabilityFlag(orderContext.serviceScope, orderContext.orderType);
  const presenceResult = await supabase
    .from('driver_presence')
    .select('driver_id,is_online,state,active_service_type,current_order_id,lat,lng,last_seen_at,updated_at')
    .eq('is_online', true)
    .in('state', ['online', 'paused'])
    .is('current_order_id', null)
    .limit(500);
  if (presenceResult.error) throw presenceResult.error;

  const presenceRows = Array.isArray(presenceResult.data) ? presenceResult.data : [];
  const eligiblePresence = presenceRows
    .filter((row) => row?.driver_id && !excluded.has(String(row.driver_id)))
    .map((row) => {
      const lat = toFinite(row.lat);
      const lng = toFinite(row.lng);
      if (lat == null || lng == null) return null;
      const dist_km = haversineKm(orderContext.lat, orderContext.lng, lat, lng);
      if (!Number.isFinite(dist_km) || (dist_km * 1000) > radiusMeters) return null;
      const seenAt = row.last_seen_at || row.updated_at || null;
      const freshness_minutes = seenAt ? Math.max(0, (Date.now() - Date.parse(seenAt)) / 60000) : 9999;
      return {
        driver_id: row.driver_id,
        is_online: row.is_online,
        state: row.state,
        active_service_type: row.active_service_type || null,
        current_order_id: row.current_order_id || null,
        lat,
        lng,
        dist_km,
        freshness_minutes,
        last_seen_at: row.last_seen_at || row.updated_at || null,
      };
    })
    .filter(Boolean)
    .filter((row) => row.freshness_minutes <= 5);

  if (!eligiblePresence.length) return [];

  const driverIds = [...new Set(eligiblePresence.map((row) => row.driver_id))];
  const [settingsResult, vehicleRows, applicationsResult] = await Promise.all([
    supabase
      .from('driver_service_settings')
      .select('user_id,city_passenger,city_delivery,city_freight,intercity_passenger,intercity_delivery,intercity_freight,interdistrict_passenger,interdistrict_delivery,interdistrict_freight')
      .in('user_id', driverIds),
    fetchVehicleRows(supabase, driverIds),
    supabase
      .from('driver_applications')
      .select('user_id,status,created_at')
      .in('user_id', driverIds),
  ]);

  if (settingsResult.error) throw settingsResult.error;
  if (applicationsResult.error) throw applicationsResult.error;

  const approvedSet = new Set(
    (applicationsResult.data || [])
      .filter((row) => String(row.status || '').trim().toLowerCase() === 'approved')
      .map((row) => String(row.user_id))
  );

  const settingsMap = new Map();
  for (const row of settingsResult.data || []) {
    settingsMap.set(String(row.user_id), rowToSettingsMap(row));
  }

  const vehiclesMap = new Map();
  for (const row of vehicleRows || []) {
    const normalized = normalizeVehicle(row);
    const key = String(normalized.user_id || '');
    if (!key) continue;
    if (!vehiclesMap.has(key)) vehiclesMap.set(key, []);
    vehiclesMap.get(key).push(normalized);
  }

  return eligiblePresence
    .filter((row) => approvedSet.has(String(row.driver_id)))
    .map((row) => {
      const settings = settingsMap.get(String(row.driver_id)) || {};
      if (!driverSupportsCapability(settings, capabilityFlag)) return null;
      const vehicles = vehiclesMap.get(String(row.driver_id)) || [];
      const activeVehicle = vehicles.find((vehicle) => vehicle.is_active) || vehicles[0] || null;
      if (!activeVehicle || !canVehicleHandleOrder(activeVehicle, orderContext)) return null;
      const capability_score = activeVehicle.is_active ? 12 : 8;
      return {
        driver_id: row.driver_id,
        dist_km: Number(row.dist_km.toFixed(4)),
        freshness_minutes: Number(row.freshness_minutes.toFixed(4)),
        capability_score,
        vehicle_id: activeVehicle.id,
        vehicle_type: activeVehicle.vehicle_type,
        seat_count: activeVehicle.seat_count,
        max_weight_kg: activeVehicle.max_weight_kg,
        max_volume_m3: activeVehicle.max_volume_m3,
        active_service_type: row.active_service_type,
        last_seen_at: row.last_seen_at,
      };
    })
    .filter(Boolean)
    .map((row) => ({ ...row, dispatch_score: computeDispatchScore(row, orderContext) }))
    .sort((a, b) => b.dispatch_score - a.dispatch_score || a.dist_km - b.dist_km)
    .slice(0, limit);
}

export async function findDriversInRadius({
  supabase,
  lat,
  lng,
  radiusMeters = 2000,
  serviceType = 'taxi',
  serviceScope = null,
  orderType = null,
  passengerCount = 0,
  cargoWeightKg = 0,
  cargoVolumeM3 = 0,
  limit = 50,
  orderId = null,
  excludedDriverIds = [],
}) {
  const safeLat = toFinite(lat);
  const safeLng = toFinite(lng);
  const safeRadius = Math.max(200, toFinite(radiusMeters, 2000));
  const safeLimit = Math.max(1, Math.min(200, toFinite(limit, 50)));
  if (safeLat == null || safeLng == null) return [];

  const orderContext = {
    orderId,
    lat: safeLat,
    lng: safeLng,
    radiusMeters: safeRadius,
    serviceType: normalizeServiceType(serviceType),
    serviceScope: normalizeServiceScope(serviceType, serviceScope),
    orderType: String(orderType || deriveOrderType(serviceType)).trim().toLowerCase(),
    passengerCount: toFinite(passengerCount, 0),
    cargoWeightKg: toFinite(cargoWeightKg, 0),
    cargoVolumeM3: toFinite(cargoVolumeM3, 0),
  };

  if (orderContext.orderId) {
    try {
      const rpcRows = await findDriversViaRpc({ supabase, orderContext, radiusMeters: safeRadius, limit: safeLimit, excludedDriverIds });
      if (rpcRows.length) {
        return rpcRows
          .map((row) => ({
            ...row,
            driver_id: row.driver_id || row.id,
            dist_km: toFinite(row.dist_km, null),
            capability_score: toFinite(row.capability_score, 0),
            freshness_minutes: toFinite(row.freshness_minutes, 0),
            dispatch_score: toFinite(row.dispatch_score, 0),
          }))
          .slice(0, safeLimit);
      }
    } catch (_) {
      // migration hali yo'q bo'lsa JS fallback ishlaydi
    }
  }

  return findDriversViaFallback({
    supabase,
    orderContext,
    radiusMeters: safeRadius,
    limit: safeLimit,
    excludedDriverIds,
  });
}
