import React from "react";
// Bu biz oldin to'g'irlagan Asosiy Xarita va Buyurtma berish komponenti
import ClientOrderCreate from "./ClientOrderCreate"; 

export default function ClientTaxi({ onBack }) {
  // Bu komponent shunchaki "Shahar taksi" bo'limini ochadi.
  // Barcha mantiq (Xarita, Narx, Supabase) ClientOrderCreate ichida yozilgan.

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      animation: 'slideUp 0.3s ease-out', // Sahifa ochilishida chiroyli effekt
      background: '#fff' 
    }}>

      {/* Asosiy ishchi komponent shu yerda chaqiriladi */}
      <ClientOrderCreate onBack={onBack} />

      {/* Animatsiya uslubi */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}