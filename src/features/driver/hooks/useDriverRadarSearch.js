import { useEffect, useRef, useState } from "react";
import { searchDriversNearby } from "../components/services/driverSearchService";

export default function useDriverRadarSearch({ enabled, center, radiusMeters = 1500 }) {
  const [drivers, setDrivers] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | searching | found | empty | error
  const [error, setError] = useState(null);

  const timerRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      setError(null);
      setDrivers([]);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }

    setStatus("searching");
    setError(null);

    const run = async () => {
      try {
        const res = await searchDriversNearby({ center, radiusMeters });
        setDrivers(res);

        if (res?.length > 0) setStatus("found");
        else setStatus("empty");
      } catch (e) {
        setStatus("error");
        setError("Driver qidirishda xatolik");
      }
    };

    run();

    // realtime polling (masalan 3s)
    timerRef.current = setInterval(run, 3000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [enabled, center?.[0], center?.[1], radiusMeters]);

  return { drivers, status, error };
}
