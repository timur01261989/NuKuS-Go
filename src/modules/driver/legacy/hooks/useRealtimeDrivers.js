import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/services/supabase/supabaseClient";

function haversineMeters(a, b) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export default function useRealtimeDrivers({ enabled, center, radiusMeters = 2000 }) {
  const [presenceRows, setPresenceRows] = useState([]);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!enabled || !center?.length) {
        setStatus("idle");
        setPresenceRows([]);
        return;
      }
      if (!supabase) {
        setStatus("error");
        return;
      }
      setStatus("loading");
      try {
        const { data, error } = await supabase
          .from("driver_presence")
          .select("driver_id,is_online,lat,lng,updated_at,last_seen_at")
          .eq("is_online", true);
        if (error) throw error;
        if (cancelled) return;
        setPresenceRows(data || []);
        setStatus("live");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [enabled, center?.[0], center?.[1], radiusMeters]);

  useEffect(() => {
    if (!enabled || !supabase) return;
    const ch = supabase
      .channel("driver-presence-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "driver_presence" }, (payload) => {
        const row = payload.new;
        const key = row?.driver_id;
        if (!key) return;
        setPresenceRows((prev) => {
          const map = new Map(prev.map((x) => [x.driver_id, x]));
          map.set(key, row);
          return Array.from(map.values());
        });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [enabled]);

  const drivers = useMemo(() => {
    if (!enabled || !center?.length) return [];
    return (presenceRows || [])
      .filter((row) => row.is_online === true && Number.isFinite(row.lat) && Number.isFinite(row.lng))
      .map((row) => ({ id: row.driver_id, lat: row.lat, lng: row.lng, updated_at: row.updated_at || row.last_seen_at || null }))
      .filter((row) => haversineMeters(center, [row.lat, row.lng]) <= radiusMeters);
  }, [enabled, center?.[0], center?.[1], radiusMeters, presenceRows]);

  return { drivers, status };
}
