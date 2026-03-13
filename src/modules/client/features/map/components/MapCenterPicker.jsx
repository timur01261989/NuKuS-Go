import { useMapEvents } from "react-leaflet";

export default function MapCenterPicker({ enabled, onPick, onMovingChange, onHaptic }) {
  useMapEvents({
    movestart: () => {
      if (!enabled) return;
      onMovingChange?.(true);
    },
    moveend: (e) => {
      if (!enabled) return;

      const c = e.target.getCenter();
      onPick([c.lat, c.lng]);

      onMovingChange?.(false);
      onHaptic?.();
    }
  });

  return null;
}
