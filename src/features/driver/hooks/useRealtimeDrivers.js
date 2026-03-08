
// FIX: normalize driver id safely (keeps existing logic)
const normalizeDriverId = (row) => row?.driver_id ?? row?.driver_id ?? row?.user_id ?? row?.id;
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

function haversineMeters(a, b) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371000;

  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(x));
}

export default function useRealtimeDrivers({ enabled, center, radiusMeters = 2000 }) {
  const [drivers, setDrivers] = useState([]); // drivers table
  const [locs, setLocs] = useState([]); // driver_locations table
  const [status, setStatus] = useState("idle"); // idle|loading|live|error

  const getDriverKey = (row) => row?.user_id || row?.id || null;
  const getLocKey = (row) => row?.driver_id || row?.driver_id || row?.user_id || row?.id || null;

  // initial load
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!enabled || !center?.length) {
        setStatus("idle");
        setDrivers([]);
        setLocs([]);
        return;
      }

      if (!supabase) {
        setStatus("error");
        return;
      }

      setStatus("loading");

      try {
        // IMPORTANT: the project uses multiple schema variants for `drivers`.
        // Selecting a missing column (or filtering on a missing column) triggers PostgREST errors.
        // So we load rows best-effort and filter in JS when columns exist.
        const d1 = await supabase.from("drivers").select("*");
        if (d1.error) throw d1.error;

        const d2 = await supabase
          .from("driver_locations")
          .select("*");

        if (d2.error) throw d2.error;

        if (cancelled) return;

        // Normalize drivers to a consistent shape.
        // Prefer user_id as the stable identifier; fall back to id.
        setDrivers(
          (d1.data || []).map((d) => {
            const key = getDriverKey(d);
            return {
              ...d,
              id: key,
              // If schema doesn't have these fields, default to values that keep drivers visible.
              is_online: typeof d?.is_online === "boolean" ? d.is_online : true,
              is_busy: typeof d?.is_busy === "boolean" ? d.is_busy : false,
            };
          })
        );
        setLocs(d2.data || []);
        setStatus("live");
      } catch {
        if (cancelled) return;
        setStatus("error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [enabled, center?.[0], center?.[1], radiusMeters]);

  // realtime subscribe
  useEffect(() => {
    if (!enabled || !supabase) return;

    const ch = supabase
      .channel("drivers-realtime")
	      .on("postgres_changes", { event: "*", schema: "public", table: "drivers" }, (payload) => {
	        const row = payload.new;
	        const key = getDriverKey(row);
	        if (!key) return;

	        setDrivers((prev) => {
	          const map = new Map(prev.map((x) => [x.id, x]));
	          map.set(key, {
	            ...row,
	            id: key,
	            is_online: typeof row?.is_online === "boolean" ? row.is_online : (map.get(key)?.is_online ?? true),
	            is_busy: typeof row?.is_busy === "boolean" ? row.is_busy : (map.get(key)?.is_busy ?? false),
	          });
	          return Array.from(map.values());
	        });
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "driver_locations" },
        (payload) => {
          const row = payload.new;
          const k = getLocKey(row);
          if (!k) return;

          setLocs((prev) => {
            const map = new Map(prev.map((x) => [getLocKey(x), x]));
            map.set(k, row);
            return Array.from(map.values());
          });
}
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [enabled]);

  // merge + radius filter
  const driversInRadius = useMemo(() => {
    if (!enabled || !center?.length) return [];

    // Build a set of "online & not busy" identifiers.
    // Support both schema variants:
    //  - driver_locations.driver_id references drivers.user_id
    const onlineSet = new Set();
    const idToUserId = new Map();

    (drivers || [])
      .filter((d) => d.is_online === true && d.is_busy === false)
      .forEach((d) => {
        if (d?.id) onlineSet.add(d.id);
        if (d?.user_id) onlineSet.add(d.user_id);
        if (d?.id && d?.user_id) idToUserId.set(d.id, d.user_id);
      });

    return (locs || [])
      .filter((l) => onlineSet.has(l.driver_id))
      .map((l) => ({
        // Return canonical driver user_id whenever it is available
        id: idToUserId.get(l.driver_id) || l.driver_id,
        lat: l.lat,
        lng: l.lng,
        updated_at: l.updated_at,
      }))
      .filter((d) => haversineMeters(center, [d.lat, d.lng]) <= radiusMeters);
  }, [enabled, center?.[0], center?.[1], radiusMeters, drivers, locs]);

  return { drivers: driversInRadius, status };
}
