import SearchRadar from '../features/map/components/SearchRadar';
import RatingCelebration from '../../ui/components/RatingCelebration';
import { playSound } from '../utils/audioPlayer';
// 1. IMPORTLAR (Faylning eng tepasida)
import React, { useEffect } from 'react';
import { playAliceVoice } from '../utils/audioPlayer';
import SearchRadar from './map/SearchRadar';

const ClientMap = ({ status }) => { // 'status' props yoki context orqali keladi

  // 2. EFFEKT (Komponent ichida, return'dan oldin)
  useEffect(() => {
    if (status === 'on_ride') {
      // Safar boshlanganda Alisa "Yo'nalish tuzildi" deydi
      playAliceVoice('RouteStarted');
    } else if (status === 'arrived') {
      // Manzilga yetganda Alisa "Yetib keldik" deydi
      playAliceVoice('Arrived');
    } else if (status === 'searching') {
      // Yangi buyurtma qidirilayotganda ovoz chiqishi mumkin
      // playAliceVoice('Searching'); // Agar papka bo'lsa
    }
  }, [status]); // Status o'zgarganda ushbu funksiya qayta ishlaydi

  return (
    <div style={{ position: 'relative' }}>
      {/* 3. VIZUAL ELEMENT (Xarita ustida) */}
      <SearchRadar isVisible={status === 'searching'} />

      {/* Xarita komponenti shu yerda bo'ladi */}
      <MapContainer>
        {/* ... */}
      </MapContainer>
    </div>
  );
};

export default ClientMap;
// ... Komponent ichida
const [status, setStatus] = useState('searching');
const [showRating, setShowRating] = useState(false);

// Buyurtma holati o'zgarganda ovoz chiqarish
useEffect(() => {
  if (status === 'searching') playSound('new_order');
  if (status === 'on_ride') playSound('start_trip');
}, [status]);

return (
  <div className="map-wrapper">
    {/* 1. Xarita qidiruv holatida radar chiqadi */}
    <SearchRadar isVisible={status === 'searching'} />

    {/* 2. Safar tugab, 5 yulduz berilganda kuchukcha chiqadi */}
    <RatingCelebration show={showRating} />

    {/* Xarita komponenti */}
    <MapContainer ...t />
  </div>
);
<MapContainer center={center} zoom={13}>
  <TileLayer url={tileUrl} />

  
  {/* 1. YO'NALISH CHIZIG'I (POLYLINE) */}
  {routeCoordinates.length > 0 && (
    <Polyline 
      positions={routeCoordinates} 
      pathOptions={{
        color: isNightMode ? '#FFD700' : '#000', // Tunda sariq neon
        weight: 6,
        opacity: 0.8,
        lineJoin: 'round',
        dashArray: status === 'searching' ? '1, 15' : 'none' // Qidiruvda nuqtali chiziq
      }} 
    />
  )}

  {/* 2. MARKERLAR */}
  <Marker position={pickupLoc} icon={pickupIcon} />
  <Marker position={destLoc} icon={destIcon} />
</MapContainer>