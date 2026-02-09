import React, { useState, useEffect } from 'react';
import NewOrderModal from '../components/driver/NewOrderModal';

const DriverMap = () => {
  // Boshida oyna yopiq turadi (false)
  const [showModal, setShowModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);

  // ... davomi pastda
  useEffect(() => {
    // Buyurtmalarni kuzatuvchi funksiya (Real-time)
    const subscription = supabase
      .from('orders')
      .on('INSERT', (payload) => {
        // Yangi buyurtma tushganida:
        setCurrentOrder(payload.new); // Ma'lumotni saqlaymiz
        setShowModal(true);           // Oynani ochamiz (Kalitni buraymiz!)
      })
      .subscribe();

    return () => supabase.removeSubscription(subscription);
  }, []);
  return (
    <div className="map-wrapper">
      {/* Xarita komponenti */}
      <MapContainer />

      {/* SHART: faqat showModal true bo'lgandagina oyna ko'rinadi */}
      {showModal && (
        <NewOrderModal 
          order={currentOrder} 
          onAccept={() => {
            setShowModal(false); // Tugma bosilgach oynani yopamiz
            // ... qabul qilish mantig'i
          }}
          onDecline={() => setShowModal(false)} // Rad etilsa ham yopiladi
        />
      )}
    </div>
  );
  return (
    <div style={{ position: 'relative', height: '100vh' }}>
      <MapContainer center={myLocation} zoom={15}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* 1. Haydovchi va Mijoz markerlari */}
        <Marker position={myLocation} icon={driverIcon} />
        {currentOrder && <Marker position={currentOrder.pickup_location} icon={userIcon} />}

        {/* 2. Yo'nalish chizig'i */}
        {routePoints && <RouteLine points={routePoints} />}
      </MapContainer>

      {/* 3. Yangi buyurtma oynasi (Ovozli va miltillovchi) */}
      {showModal && (
        <NewOrderModal 
          order={currentOrder} 
          onAccept={() => handleAcceptOrder(currentOrder)}
          onDecline={() => setShowModal(false)}
        />
      )}
    </div>
  );
  const handleAcceptOrder = async (order) => {
    // 1. Oynani yopish
    setShowModal(false);

    // 2. Alisa paketidan "Yo'nalish tuzildi" ovozini chaqirish
    playAliceVoice('RouteStarted');

    // 3. Bazada buyurtma holatini yangilash (Supabase)
    const { error } = await supabase
      .from('orders')
      .update({ status: 'accepted', driver_id: myId })
      .eq('id', order.id);

    // 4. Xaritada yo'nalishni chizish uchun koordinatalarni sozlash
    setDestination(order.pickup_location); 
  };