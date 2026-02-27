import { useEffect, useState } from "react";

export default function useGeolocation(fallback = [42.4619, 59.6166]) {
  const [userLoc, setUserLoc] = useState(fallback);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc([pos.coords.latitude, pos.coords.longitude]),
      () => setUserLoc(fallback)
    );
  }, []);

  return { userLoc };
}
