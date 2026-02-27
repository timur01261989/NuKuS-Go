import { useEffect, useRef } from "react";
import { message } from "antd";
import { useTaxi } from "../context/TaxiProvider";
import { cityTaxiApi } from "../services/cityTaxiApi";
import { haversineKm, smoothHeading } from "../utils/geo";

/**
 * useDriverLocation.js
 * - GPS kuzatadi (watchPosition)
 * - Serverga yuboradi (throttle)
 * - Xarita markeriga heading beradi
 */
export function useDriverLocation({ enabled }) {
  const { dispatch } = useTaxi();
  const watchIdRef = useRef(null);
  const lastSendRef = useRef(0);
  const lastSentLatLngRef = useRef(null);
  const lastHeadingRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    if (!navigator.geolocation) {
      message.error("Geolokatsiya mavjud emas");
      return;
    }

    const onPos = async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const acc = pos.coords.accuracy;
      const headingRaw = Number.isFinite(pos.coords.heading) ? pos.coords.heading : null;

      const heading = smoothHeading(lastHeadingRef.current, headingRaw);
      lastHeadingRef.current = heading;

      dispatch({
        type: "driver/setLocation",
        payload: {
          latlng: [lat, lng],
          heading,
          accuracy: acc,
          updatedAt: Date.now(),
        },
      });

      const now = Date.now();
      // ✅ Throttle + distance gate:
      // - juda tez-tez DB/serverga yozish (1s) -> write storm + realtime lag
      // - amaliy MVP: 5-7 sekundda 1 marta yoki 25m+ siljisa yuboramiz
      const last = lastSentLatLngRef.current;
      const movedM = last ? haversineKm([last[0], last[1]], [lat, lng]) * 1000 : Infinity;
      const dueByTime = now - lastSendRef.current >= 7000;
      const dueByMove = movedM >= 25 && now - lastSendRef.current >= 5000;

      if (dueByTime || dueByMove) {
        lastSendRef.current = now;
        lastSentLatLngRef.current = [lat, lng];
        try {
          await cityTaxiApi.sendDriverLocation({ lat, lng, heading, accuracy: acc });
        } catch {
          // silent
        }
      }
    };

    const onErr = (err) => {
      console.warn("GPS error", err);
    };

    watchIdRef.current = navigator.geolocation.watchPosition(onPos, onErr, {
      enableHighAccuracy: true,
      maximumAge: 1500,
      timeout: 12000,
    });

    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    };
  }, [enabled, dispatch]);
}
