// src/pages/DriverDashboard.jsx
import { useEffect } from 'react';
import { playAliceVoice } from '../utils/audioPlayer';

const DriverDashboard = ({ newOrder }) => {
  useEffect(() => {
    if (newOrder) {
      // Agar fayl bo'lsa:
      const audio = new Audio('/assets/audio/incoming_order.mp3');
      audio.loop = true; // Haydovchi tugmani bosmaguncha chalinaveradi
      audio.play();

      // Alisa ham ogohlantirsin
      playAliceVoice('NewOrder'); // Agar papka bo'lsa

      return () => audio.pause(); // Komponent yopilganda to'xtatish
    }
  }, [newOrder]);

  return (
    <div className="order-modal">
      <h2>Yangi buyurtma!</h2>
      <button onClick={acceptOrder}>Qabul qilish</button>
    </div>
  );
};