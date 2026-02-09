import Lottie from "lottie-react";
import radarAnim from "../../assets/lottie/radar_animation.json";
import { Polyline } from 'react-leaflet';
import Lottie from "lottie-react";
import radarAnim from "../../assets/lottie/radar_animation.json";

const SearchRadar = ({ isVisible }) => {
  if (!isVisible) return null;
  return (
    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000 }}>
      <Lottie animationData={radarAnim} loop={true} style={{ width: 300, height: 300 }} />
    </div>
  );
};
export default SearchRadar;
const RouteLine = ({ positions, isNightMode }) => {
  if (!positions || positions.length === 0) return null;

  return (
    <Polyline 
      positions={positions} 
      pathOptions={{
        color: isNightMode ? '#FFD700' : '#2196F3', // Neon sariq yoki ko'k
        weight: 6,
        lineJoin: 'round'
      }} 
    />
  );
};

export default RouteLine;

const SearchRadar = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div style={{
      position: 'absolute', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)', zIndex: 1000,
      pointerEvents: 'none'
    }}>
      <Lottie animationData={radarAnim} loop={true} style={{ width: 300, height: 300 }} />
    </div>
  );
};

export default SearchRadar;