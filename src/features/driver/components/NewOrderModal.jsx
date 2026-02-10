import React, { useEffect } from 'react';
import { playAliceVoice } from '../../../utils/AudioPlayer';

const NewOrderModal = ({ order, onAccept, onDecline }) => {
  useEffect(() => {
    // Alisaning "1" papkasidagi signalini chalamiz
    const interval = setInterval(() => {
      playAliceVoice('1'); 
    }, 2000); // Har 2 soniyada signal beradi

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="order-overlay animated-pulse">
      <div className="order-card">
        <div className="order-header">Yangi buyurtma!</div>
        <div className="order-body">
          <p><strong>Yo'nalish:</strong> {order.address}</p>
          <p><strong>Masofa:</strong> {order.distance} km</p>
          <p><strong>Narxi:</strong> {order.price} so'm</p>
        </div>
        <div className="order-actions">
          <button className="btn-decline" onClick={onDecline}>Rad etish</button>
          <button className="btn-accept" onClick={onAccept}>Qabul qilish</button>
        </div>
      </div>
    </div>
  );
};

export default NewOrderModal;