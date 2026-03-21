import { Waypoint, Route, RouteStep } from "./routing.types";

const OSRM_URL = process.env.OSRM_URL || "http://router.project-osrm.org";
const GRAPHHOPPER_URL = process.env.GRAPHHOPPER_URL || "";
const USE_LOCAL = Boolean(OSRM_URL.includes("localhost") || OSRM_URL.includes("osrm-backend"));

function encodeSimplePolyline(coords: [number, number][]): string {
  let output = "", prevLat = 0, prevLng = 0;
  for (const [lat, lng] of coords) {
    const dLat = Math.round((lat - prevLat) * 1e5);
    const dLng = Math.round((lng - prevLng) * 1e5);
    const encodeVal = (v: number): string => {
      let encoded = "", val = v < 0 ? ~(v << 1) : v << 1;
      while (val >= 0x20) { encoded += String.fromCharCode(((val & 0x1f) | 0x20) + 63); val >>= 5; }
      return encoded + String.fromCharCode(val + 63);
    };
    output += encodeVal(dLat) + encodeVal(dLng);
    prevLat = lat; prevLng = lng;
  }
  return output;
}

export async function getRoute(
  waypoints:  Waypoint[],
  profile:    "car" | "bike" | "foot" = "car",
  alternatives = true
): Promise<Route> {
  const coords = waypoints.map(w => `${w.lng},${w.lat}`).join(";");
  const url = `${OSRM_URL}/route/v1/${profile}/${coords}?` +
    `overview=full&steps=true&annotations=true&` +
    `alternatives=${alternatives}&geometries=polyline6&continue_straight=false`;

  try {
    const res  = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.length) throw new Error("OSRM no route");
    return parseOSRMRoute(data.routes[0], waypoints);
  } catch {
    // Fallback: straight-line estimate
    return buildFallbackRoute(waypoints);
  }
}

function parseOSRMRoute(raw: any, waypoints: Waypoint[]): Route {
  const steps: RouteStep[] = [];
  for (const leg of raw.legs || []) {
    for (const step of leg.steps || []) {
      const maneuver = step.maneuver;
      let type: RouteStep["maneuver"] = "straight";
      if (maneuver.type === "turn" && maneuver.modifier === "left")  type = "turn-left";
      if (maneuver.type === "turn" && maneuver.modifier === "right") type = "turn-right";
      if (maneuver.type === "arrive")     type = "arrive";
      if (maneuver.type === "depart")     type = "depart";
      if (maneuver.type === "roundabout") type = "roundabout";
      if (maneuver.type === "merge")      type = "merge";

      steps.push({
        instruction:   step.name || buildInstruction(type, step.name),
        distance_m:    Math.round(step.distance),
        duration_s:    Math.round(step.duration),
        bearing_after: maneuver.bearing_after || 0,
        maneuver:      type,
        street_name:   step.name || undefined,
      });
    }
  }

  const totalDist = raw.legs.reduce((s: number, l: any) => s + l.distance, 0);
  const totalDur  = raw.legs.reduce((s: number, l: any) => s + l.duration, 0);

  return {
    distance_m:    Math.round(totalDist),
    duration_s:    Math.round(totalDur),
    polyline:      raw.geometry,
    waypoints,
    steps,
    traffic_level: totalDur / (totalDist / 14) > 2.5 ? "jam" : totalDur / (totalDist / 14) > 1.5 ? "slow" : "free",
    via_roads:     steps.filter(s => s.street_name).map(s => s.street_name!).slice(0, 5),
  };
}

function buildInstruction(type: RouteStep["maneuver"], street: string): string {
  const m: Record<string, string> = {
    "turn-left":  `Chapga buring${street ? " " + street + " ga" : ""}`,
    "turn-right": `O'ngga buring${street ? " " + street + " ga" : ""}`,
    "straight":   `To'g'ri boring${street ? " " + street + " bo'ylab" : ""}`,
    "arrive":     "Manzilga yetib keldingiz",
    "depart":     `Yo'lni boshlang${street ? " " + street + " bo'ylab" : ""}`,
    "roundabout": "Aylanma chorrahaga kiring",
    "merge":      "Asosiy yo'lga qo'shiling",
  };
  return m[type] || "Davom eting";
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000, toR = (d: number) => d * Math.PI / 180;
  const dL = toR(lat2 - lat1), dG = toR(lng2 - lng1);
  return R * 2 * Math.atan2(Math.sqrt(Math.sin(dL/2)**2 + Math.cos(toR(lat1))*Math.cos(toR(lat2))*Math.sin(dG/2)**2), Math.sqrt(1 - (Math.sin(dL/2)**2 + Math.cos(toR(lat1))*Math.cos(toR(lat2))*Math.sin(dG/2)**2)));
}

function buildFallbackRoute(waypoints: Waypoint[]): Route {
  let dist = 0;
  for (let i = 1; i < waypoints.length; i++) {
    dist += haversine(waypoints[i-1].lat, waypoints[i-1].lng, waypoints[i].lat, waypoints[i].lng);
  }
  const coords: [number, number][] = waypoints.map(w => [w.lat, w.lng]);
  return {
    distance_m:    Math.round(dist),
    duration_s:    Math.round((dist / 1000) / 35 * 3600),
    polyline:      encodeSimplePolyline(coords),
    waypoints,
    steps:         [{ instruction: "Manzilga boring", distance_m: Math.round(dist), duration_s: Math.round((dist/1000)/35*3600), bearing_after: 0, maneuver: "straight" }],
    traffic_level: "free",
    via_roads:     [],
  };
}

export async function getMatrix(
  origins:      Waypoint[],
  destinations: Waypoint[],
  profile = "car"
): Promise<{ durations: number[][]; distances: number[][] }> {
  const sources = origins.map(w => `${w.lng},${w.lat}`).join(";");
  const dests   = destinations.map(w => `${w.lng},${w.lat}`).join(";");
  const url = `${OSRM_URL}/table/v1/${profile}/${sources};${dests}?sources=${origins.map((_, i) => i).join(";")}&destinations=${destinations.map((_, i) => i + origins.length).join(";")}`;

  try {
    const res  = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    return { durations: data.durations || [[]], distances: data.distances || [[]] };
  } catch {
    // Fallback: Haversine-based matrix
    const durations = origins.map(o => destinations.map(d => {
      const dist = haversine(o.lat, o.lng, d.lat, d.lng);
      return Math.round((dist / 1000) / 35 * 3600);
    }));
    const distances = origins.map(o => destinations.map(d => Math.round(haversine(o.lat, o.lng, d.lat, d.lng))));
    return { durations, distances };
  }
}
