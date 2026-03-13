import React, { useEffect, useMemo, useRef, useState } from "react";
import { CircleMarker, Popup, useMap } from "react-leaflet";

/**
 * ParkingLayer
 * - Fetches OSM parking POIs via Overpass API within current viewport.
 * - Caches by bbox to avoid spam.
 *
 * Overpass is community infrastructure; be respectful:
 * - throttle requests
 * - cache results
 */
function bboxKey(b) {
  // round bbox to reduce churn
  const r = (n) => Math.round(n * 1000) / 1000;
  return [r(b.getSouth()), r(b.getWest()), r(b.getNorth()), r(b.getEast())].join(",");
}

async function overpassFetch({ overpassUrl, bbox }) {
  const [s, w, n, e] = bbox;
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="parking"](${s},${w},${n},${e});
      way["amenity"="parking"](${s},${w},${n},${e});
      relation["amenity"="parking"](${s},${w},${n},${e});
    );
    out center 200;
  `;
  const res = await fetch(overpassUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: "data=" + encodeURIComponent(query),
  });
  if (!res.ok) throw new Error("overpass_failed");
  return await res.json();
}

export default function ParkingLayer({ enabled }) {
  const map = useMap();
  const overpassUrl = useMemo(() => (import.meta?.env?.VITE_OVERPASS_URL || "https://overpass-api.de/api/interpreter"), []);
  const cacheRef = useRef(new Map());
  const inFlightRef = useRef(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      return;
    }

    let cancelled = false;

    async function load() {
      if (inFlightRef.current) return;
      const b = map.getBounds();
      const key = bboxKey(b);
      const cached = cacheRef.current.get(key);
      if (cached) {
        setItems(cached);
        return;
      }

      inFlightRef.current = true;
      try {
        const bbox = [b.getSouth(), b.getWest(), b.getNorth(), b.getEast()];
        const data = await overpassFetch({ overpassUrl, bbox });

        const parsed = (data?.elements || [])
          .map((el) => {
            const lat = el.lat ?? el.center?.lat;
            const lon = el.lon ?? el.center?.lon;
            if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
            const name = el.tags?.name || "Parking";
            const access = el.tags?.access || null;
            const fee = el.tags?.fee || null;
            return { id: `${el.type}:${el.id}`, lat, lng: lon, name, access, fee };
          })
          .filter(Boolean)
          .slice(0, 300); // hard cap

        if (!cancelled) {
          cacheRef.current.set(key, parsed);
          setItems(parsed);
        }
      } catch (_) {
        if (!cancelled) setItems([]);
      } finally {
        inFlightRef.current = false;
      }
    }

    // load now + on move end (throttled by cache key)
    load();
    const onMoveEnd = () => load();
    map.on("moveend", onMoveEnd);

    return () => {
      cancelled = true;
      map.off("moveend", onMoveEnd);
    };
  }, [enabled, map, overpassUrl]);

  if (!enabled) return null;

  return (
    <>
      {items.map((p) => (
        <CircleMarker
          key={p.id}
          center={[p.lat, p.lng]}
          radius={6}
          pathOptions={{}}
          // Leaflet default color is fine; avoid hardcoding colors if you use them globally elsewhere
        >
          <Popup>
            <div style={{ minWidth: 160 }}>
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              {p.fee ? <div>Fee: {String(p.fee)}</div> : null}
              {p.access ? <div>Access: {String(p.access)}</div> : null}
              <div style={{ opacity: 0.7, fontSize: 12 }}>OSM</div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
}