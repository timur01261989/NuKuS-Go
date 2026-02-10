import { Polyline } from 'react-leaflet';

const RouteLine = ({ points }) => {
  if (!points || points.length < 2) return null;

  return (
    <Polyline 
      positions={points} 
      pathOptions={{
        color: '#2196F3', // Moviy rang (Yandex Go uslubida)
        weight: 6,
        opacity: 0.8,
        lineJoin: 'round'
      }} 
    />
  );
};

export default RouteLine;