import { useEffect, useState } from "react";

export default function useReverseGeocode(latlng, fallbackText = "") {
  const [address, setAddress] = useState(fallbackText);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const [lat, lng] = latlng || [];
        if (lat == null || lng == null) return;

        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data = await res.json();
        const name = data?.display_name ? data.display_name.split(",").slice(0, 2).join(", ") : fallbackText;

        if (!cancelled) setAddress(name || fallbackText);
      } catch {
        if (!cancelled) setAddress(fallbackText);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [latlng?.[0], latlng?.[1]]);

  return { address };
}
