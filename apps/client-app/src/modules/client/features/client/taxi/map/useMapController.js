import { useCallback, useRef } from "react";

/** mapRef + flyTo helpers */
export default function useMapController() {
  const mapRef = useRef(null);

  const flyTo = useCallback((latlng, zoom = 16, opts = { duration: 0.6 }) => {
    const map = mapRef.current;
    if (map && latlng) map.flyTo(latlng, zoom, opts);
  }, []);

  return { mapRef, flyTo };
}
