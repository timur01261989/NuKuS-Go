import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

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
        const d1 = await supabase
          .from("drivers")
          .select("id,is_online,is_busy")
          .eq("is_online", true)
          .eq("is_busy", false);

        if (d1.error) throw d1.error;

        const d2 = await supabase
          .from("driver_locations")
          .select("driver_id,lat,lng,updated_at");

        if (d2.error) throw d2.error;

        if (cancelled) return;

        setDrivers(d1.data || []);
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
        if (!row?.id) return;

        setDrivers((prev) => {
          const map = new Map(prev.map((x) => [x.id, x]));
          map.set(row.id, row);
          return Array.from(map.values());
        });
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "driver_locations" },
        (payload) => {
          const row = payload.new;
          if (!row?.driver_id) return;

          setLocs((prev) => {
            const map = new Map(prev.map((x) => [x.driver_id, x]));
            map.set(row.driver_id, row);
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

    const onlineSet = new Set(
      (drivers || [])
        .filter((d) => d.is_online === true && d.is_busy === false)
        .map((d) => d.id)
    );

    return (locs || [])
      .filter((l) => onlineSet.has(l.driver_id))
      .map((l) => ({ id: l.driver_id, lat: l.lat, lng: l.lng, updated_at: l.updated_at }))
      .filter((d) => haversineMeters(center, [d.lat, d.lng]) <= radiusMeters);
  }, [enabled, center?.[0], center?.[1], radiusMeters, drivers, locs]);

  return { drivers: driversInRadius, status };
}
