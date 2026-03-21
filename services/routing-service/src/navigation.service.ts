import { createClient } from "@supabase/supabase-js";
import { NavigationSession, Route, Waypoint } from "./routing.types";
import { getRoute } from "./osrm.client";
import { v4 as uuid } from "uuid";

const sb = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000, toR = (d: number) => d * Math.PI / 180;
  const dL = toR(lat2-lat1), dG = toR(lng2-lng1);
  return R*2*Math.atan2(Math.sqrt(Math.sin(dL/2)**2+Math.cos(toR(lat1))*Math.cos(toR(lat2))*Math.sin(dG/2)**2),Math.sqrt(1-(Math.sin(dL/2)**2+Math.cos(toR(lat1))*Math.cos(toR(lat2))*Math.sin(dG/2)**2)));
}

export async function startNavigation(
  driverId: string,
  orderId:  string,
  from:     Waypoint,
  to:       Waypoint,
  via?:     Waypoint[]
): Promise<NavigationSession> {
  const waypoints = [from, ...(via || []), to];
  const route = await getRoute(waypoints, "car", false);

  const session: NavigationSession = {
    session_id:   uuid(),
    driver_id:    driverId,
    order_id:     orderId,
    route,
    current_step: 0,
    off_route:    false,
    started_at:   new Date().toISOString(),
  };

  await sb.from("navigation_sessions").insert({
    id:           session.session_id,
    driver_id:    driverId,
    order_id:     orderId,
    route_data:   route,
    current_step: 0,
    started_at:   session.started_at,
  });

  return session;
}

export async function updatePosition(
  sessionId: string,
  driverId:  string,
  lat:       number,
  lng:       number
): Promise<{ step: number; off_route: boolean; reroute_needed: boolean; next_instruction: string }> {
  const { data: session } = await sb.from("navigation_sessions")
    .select("*").eq("id", sessionId).single();
  if (!session) throw new Error("Session not found");

  const route: Route = session.route_data;
  const steps = route.steps;
  let currentStep = session.current_step;

  // Check if driver advanced to next step
  if (currentStep < steps.length - 1) {
    const nextStep = steps[currentStep + 1];
    // Simple: check distance from step endpoint
    const stepDist = haversineM(lat, lng,
      route.waypoints[route.waypoints.length - 1].lat,
      route.waypoints[route.waypoints.length - 1].lng);
    if (stepDist < 30) currentStep++;
  }

  // Off-route detection: >100m from expected path
  const targetWp = route.waypoints[Math.min(currentStep, route.waypoints.length - 1)];
  const distToRoute = haversineM(lat, lng, targetWp.lat, targetWp.lng);
  const offRoute = distToRoute > 150;

  if (currentStep !== session.current_step || offRoute !== session.off_route) {
    await sb.from("navigation_sessions").update({ current_step: currentStep, off_route: offRoute }).eq("id", sessionId);
  }

  const nextInstruction = steps[currentStep]?.instruction || "Manzilga yetib keldingiz";

  return {
    step:              currentStep,
    off_route:         offRoute,
    reroute_needed:    offRoute && distToRoute > 300,
    next_instruction:  nextInstruction,
  };
}

export async function endNavigation(sessionId: string): Promise<void> {
  await sb.from("navigation_sessions")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", sessionId);
}
