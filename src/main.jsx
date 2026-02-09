import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import 'leaflet/dist/leaflet.css'
import RideHistory from './components/shared/RideHistory';
import './shared/styles/fonts.css';

function App() {
  const [view, setView] = useState('map'); // 'map' yoki 'history'

  return (
    <div className="app-container">
      {view === 'map' ? (
        <MainMap onOpenHistory={() => setView('history')} />
      ) : (
        <RideHistory 
          userId={currentUser.id} 
          role={currentUser.role} 
          onBack={() => setView('map')} 
        />
      )}
    </div>
  );
}

// --- TAVSIYA #3: PWA (MOBIL ILOVA HISSI) ---
// Bu kod brauzerga: "Bu shunchaki sayt emas, bu ilova!" deb buyruq beradi.
// Bu orqali foydalanuvchilar "Nukus Go"ni telefon ekraniga o'rnatib olishlari mumkin bo'ladi.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Agar loyihada 'vite-plugin-pwa' ishlatilsa, bu avtomatik ishlaydi.
    // Hozircha oddiy ro'yxatdan o'tkazish kodini yozib qo'yamiz.
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('Nukus Go oflayn rejimga tayyor: ', registration);
    }).catch(registrationError => {
      console.log('Service Worker xatosi: ', registrationError);
    });
  });
}

// --- RENDERING ---
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);