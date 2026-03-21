/**
 * Geofence Zone Manager
 * Manages surge pricing zones, restricted areas, and service boundaries
 * Uses H3 hexagonal grid for efficient containment checks
 */
import { latLngToCell, gridDisk } from "@unigo/geo-lib";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export type ZoneType = "surge" | "restricted" | "service_area" | "airport" | "train_station";

export interface GeoZone {
  id: string;
  name: string;
  type: ZoneType;
  surge_multiplier: number;  // 1.0 = normal, 2.0 = 2x surge
  h3_cells: string[];        // H3 cell IDs at resolution 8
  is_active: boolean;
  created_at: string;
}

// Zone cache (refresh every 60s)
let zoneCache: GeoZone[] = [];
let cacheExpiry = 0;

async function loadZones(): Promise<GeoZone[]> {
  if (Date.now() < cacheExpiry) return zoneCache;
  const { data } = await sb.from("geo_zones")
    .select("*")
    .eq("is_active", true);
  zoneCache = (data || []) as GeoZone[];
  cacheExpiry = Date.now() + 60_000;
  return zoneCache;
}

/**
 * Check if a coordinate falls within any active zones
 */
export async function getZonesForPoint(lat: number, lng: number): Promise<GeoZone[]> {
  const cell = await latLngToCell(lat, lng, 8);
  const zones = await loadZones();
  return zones.filter((z) => z.h3_cells.includes(cell));
}

/**
 * Get surge multiplier for a location
 */
export async function getSurgeMultiplier(lat: number, lng: number): Promise<number> {
  const zones = await getZonesForPoint(lat, lng);
  const surgeZones = zones.filter((z) => z.type === "surge");
  if (!surgeZones.length) return 1.0;
  return Math.max(...surgeZones.map((z) => z.surge_multiplier));
}

/**
 * Check if location is in a restricted zone (e.g. airport pickup)
 */
export async function isRestricted(lat: number, lng: number): Promise<boolean> {
  const zones = await getZonesForPoint(lat, lng);
  return zones.some((z) => z.type === "restricted");
}

/**
 * Create a new surge zone
 */
export async function createSurgeZone(
  name: string,
  centerLat: number,
  centerLng: number,
  radiusCells: number,
  multiplier: number
): Promise<GeoZone> {
  const cells = await gridDisk(centerLat, centerLng, radiusCells, 8);
  const { data, error } = await sb.from("geo_zones").insert({
    name, type: "surge",
    surge_multiplier: multiplier,
    h3_cells: cells,
    is_active: true,
    created_at: new Date().toISOString(),
  }).select().single();
  if (error) throw error;
  cacheExpiry = 0; // Invalidate cache
  return data as GeoZone;
}
