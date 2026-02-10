import React, { useState, useEffect, useCallback } from "react";
import NewOrderModal from "./NewOrderModal";

// Agar react-leaflet ishlatayotgan bo'lsangiz:
import { MapContainer, TileLayer, Marker } from "react-leaflet";

// supabase importi sizda qayerda bo'lsa o'shani qo'ying:
// import { supabase } from "../../../lib/supabase";

const DriverMap = () => {
  // Modal va order state'lar
  const [showModal, setShowModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);

  // Sizning loyihangizdagi mavjud qiymatlar (misol uchun):
  // const myLocation = ...
  // const myId = ...
  // const driverIcon = ...
  // const userIcon = ...
  // const routePoints = ...
  // const setDestination = ...
  // const playAliceVoice = ...
  // const RouteLine = ...

  // Buyurtmani qabul qilish funksiyasi (return'dan oldin bo'lishi shart)
  const handleAcceptOrder = useCallback(async (order) => {
    if (!order) return;

    // 1) Oynani yopish
    setShowModal(false);

    // 2) Ovoz (agar mavjud bo'lsa)
    if (typeof playAliceVoice === "function") {
      playAliceVoice("RouteStarted");
    }

    // 3) Supabase'ga update
    const { error } = await supabase
      .from("orders")
      .update({ status: "accepted", driver_id: myId })
      .eq("id", order.id);

    if (error) {
      console.error("Order update error:", error);
      return;
    }

    // 4) Yo'nalish uchun destination sozlash
    if (typeof setDestination === "function") {
      setDestination(order.pickup_location);
    }
  }, []);

  // Real-time buyurtma tinglash
  useEffect(() => {
    const subscription = supabase
      .from("orders")
      .on("INSERT", (payload) => {
        setCurrentOrder(payload.new);
        setShowModal(true);
      })
      .subscribe();

    return () => {
      // eski supabase versiyalarda shunday bo'ladi:
      supabase.removeSubscription(subscription);
    };
  }, []);

  // === Bitta return: hammasi shu yerda ===
  return (
    <div style={{ position: "relative", height: "100vh" }}>
      <MapContainer center={myLocation} zoom={15} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* 1) Haydovchi marker */}
        <Marker position={myLocation} icon={driverIcon} />

        {/* 2) Mijoz marker */}
        {currentOrder && (
          <Marker position={currentOrder.pickup_location} icon={userIcon} />
        )}

        {/* 3) Yo'nalish chizig'i */}
        {routePoints && <RouteLine points={routePoints} />}
      </MapContainer>

      {/* 4) Modal */}
      {showModal && (
        <NewOrderModal
          order={currentOrder}
          onAccept={() => handleAcceptOrder(currentOrder)}
          onDecline={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default DriverMap;
