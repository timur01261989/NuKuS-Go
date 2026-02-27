/** Compute bearing (deg) from [lat,lng] -> [lat,lng] */
export default function useBearing() {
  const bearing = (from, to) => {
    if (!from || !to) return 0;
    const [lat1, lon1] = from.map((v) => (v * Math.PI) / 180);
    const [lat2, lon2] = to.map((v) => (v * Math.PI) / 180);
    const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
    const brng = (Math.atan2(y, x) * 180) / Math.PI;
    return (brng + 360) % 360;
  };
  return { bearing };
}
