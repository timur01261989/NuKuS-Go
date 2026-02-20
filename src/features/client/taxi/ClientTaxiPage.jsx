import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Avatar,
  Button,
  Drawer,
  Input,
  List,
  Modal,
  Spin,
  message,
  Card,
  Typography
} from "antd";
import {
  ArrowLeftOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  StarFilled,
  UserOutlined,
  MenuOutlined,
  SafetyCertificateOutlined
} from "@ant-design/icons";
import { Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// ------------------------------------------------------------------
// AGAR SIZDA BU FAYLLAR YO'Q BO'LSA, PASTDA ULARNI O'CHIRIB TURING
// YOKI "MOCK" QILIB YARATIB OLING.
// ------------------------------------------------------------------
import api from "@/utils/apiHelper"; // API yordamchi
import VehicleMarker from "./components/VehicleMarker";
import TaxiMap from "./TaxiMap";
import TaxiSearchSheet from "./TaxiSearchSheet";
// import DestinationPicker from "./DestinationPicker"; // Agar yo'q bo'lsa kommentga oling

// Geo funksiyalar (agar alohida faylda bo'lsa, o'shandan oling)
// Hozircha shu yerda yozib turaman, xato bermasligi uchun:
const haversineKm = (lat1, lon1, lat2, lon2) => {
    // Masofani hisoblash logikasi (Mock)
    return 5.2; 
};

export default function ClientTaxiPage() {
  // --- STATE (HOLATLAR) ---
  const [step, setStep] = useState("main"); // main, search, dest_map, route, searching, coming, rate
  const [userLoc, setUserLoc] = useState([42.4619, 59.6166]); // Nukus markazi (Default)
  const [centerLatLng, setCenterLatLng] = useState([42.4619, 59.6166]);
  
  const [pickup, setPickup] = useState({ address: "Mening joyim", latlng: null });
  const [destination, setDestination] = useState({ address: "", latlng: null });
  
  const [routeData, setRouteData] = useState(null); // Marshrut chizig'i va narxi
  const [activeOrder, setActiveOrder] = useState(null); // Faol buyurtma
  const [isDraggingMap, setIsDraggingMap] = useState(false);
  
  const mapRef = useRef(null);

  // --- 1. USER LOC (GPS) Olish ---
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLoc([latitude, longitude]);
          setCenterLatLng([latitude, longitude]);
          setPickup((prev) => ({ ...prev, latlng: [latitude, longitude] }));
        },
        (err) => console.error("GPS Error:", err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // --- 2. QAYTA ISHLANADIGAN O'ZGARUVCHILAR (MISING PARTS FIXED) ---

  // A. STYLES (CSS)
  const Styles = (
    <style>{`
      .leaflet-div-icon { background: transparent; border: none; }
      .center-pin-container {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -100%);
        z-index: 1000;
        pointer-events: none;
        transition: transform 0.2s;
      }
      .center-pin-container.dragging {
        transform: translate(-50%, -120%) scale(1.1);
      }
      .radar-ripple {
        width: 100px; height: 100px;
        background: rgba(255, 215, 0, 0.3);
        border-radius: 50%;
        animation: ripple 1.5s infinite;
      }
      @keyframes ripple {
        0% { transform: scale(0.8); opacity: 1; }
        100% { transform: scale(2); opacity: 0; }
      }
    `}</style>
  );

  // B. HEADER (Tepadagi menyu tugmasi)
  const Header = (
    <div style={{ position: "absolute", top: 16, left: 16, zIndex: 1100 }}>
      {step === "main" ? (
        <Button 
          icon={<MenuOutlined />} 
          size="large" 
          shape="circle" 
          onClick={() => message.info("Menu ochiladi")} 
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
        />
      ) : (
        <Button 
          icon={<ArrowLeftOutlined />} 
          size="large" 
          shape="circle" 
          onClick={() => {
            if (step === "search") setStep("main");
            if (step === "dest_map") setStep("search");
            if (step === "route") setStep("search");
          }} 
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
        />
      )}
    </div>
  );

  // C. ROUTE LINE (Yo'l chizig'i)
  const RouteLine = useMemo(() => {
    if (step === "route" && routeData?.geometry) {
      return <Polyline positions={routeData.geometry} pathOptions={{ color: "#000", weight: 4 }} />;
    }
    return null;
  }, [step, routeData]);

  // D. CENTER PIN (O'rtadagi odamcha/belgi)
  const CenterPin = (step === "main" || step === "dest_map") ? (
    <div className={`center-pin-container ${isDraggingMap ? "dragging" : ""}`}>
       {/* Bu yerga sariq odamcha yoki Pin rasmini qo'ying */}
       <div style={{ fontSize: 40, color: "#FFC107", dropShadow: "0 4px 4px rgba(0,0,0,0.3)" }}>
         <EnvironmentOutlined />
       </div>
       <div style={{ 
         width: 10, height: 4, background: "rgba(0,0,0,0.3)", 
         borderRadius: "50%", margin: "0 auto", marginTop: -5 
       }} />
    </div>
  ) : null;

  // E. SEARCHING OVERLAY (Qidiruv vaqtidagi animatsiya)
  const SearchingOverlay = step === "searching" ? (
    <div style={{
      position: "absolute", top: "40%", left: "50%", transform: "translate(-50%, -50%)",
      zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "center"
    }}>
      <div className="radar-ripple" />
      <div style={{ background: "#fff", padding: "8px 16px", borderRadius: 20, marginTop: 10, fontWeight: "bold" }}>
        Haydovchi qidirilmoqda...
      </div>
    </div>
  ) : null;

  // F. DRIVER OVERLAY (Haydovchi kelayotganda)
  const DriverOverlay = step === "coming" && activeOrder ? (
    <div style={{
      position: "absolute", top: 20, right: 20, zIndex: 1000,
      background: "#fff", padding: 10, borderRadius: 8, boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
    }}>
      <b style={{fontSize: 12}}>Haydovchi yetib kelish vaqti:</b>
      <div style={{fontSize: 18, fontWeight: "bold", color: "#FAAD14"}}>~4 daqiqa</div>
    </div>
  ) : null;

  // --- MAP POSITION (Xarita balandligini hisoblash) ---
  const mapBottom = useMemo(() => {
    if (step === "main") return 280; // Asosiy ekranda joy
    if (step === "search") return 340; // Qidiruv ochilganda
    if (step === "dest_map") return 100;
    if (step === "route") return 330;
    if (step === "searching") return 240;
    if (step === "coming") return 380;
    return 0;
  }, [step]);

  // --- ACTIONS (Funksiyalar) ---
  const handleConfirmPickup = () => {
    // Markaziy nuqtani Pickup deb belgilash
    setPickup({ 
        address: "Tanlangan joy", 
        latlng: centerLatLng 
    });
    setStep("search");
  };

  const handleRouteRequest = () => {
    // API ga so'rov yuborish (Mock)
    if(!pickup.latlng || !destination.latlng) return message.error("Manzillarni tanlang");
    
    // Soxta marshrut yaratish
    const mockRoute = [
        pickup.latlng,
        [pickup.latlng[0] + 0.001, pickup.latlng[1] + 0.001], // O'rtada
        destination.latlng
    ];
    setRouteData({ geometry: mockRoute, price: 12500, dist: 4.2 });
    setStep("route");
  };

  const handleOrderStart = () => {
    setStep("searching");
    setTimeout(() => {
        setStep("coming");
        setActiveOrder({ driverName: "Ali", car: "Chevrolet Gentra", number: "01 A 777 AA" });
    }, 3000); // 3 sekunddan keyin haydovchi topildi
  };

  // --- RENDER (Asosiy ko'rinish) ---

  // Xarita komponentini yig'ish (Sizdagi TaxiMap fayliga yuboriladi)
  const MapUI = (
    <TaxiMap
      mapRef={mapRef}
      center={centerLatLng}
      step={step}
      userLoc={userLoc}
      mapBottom={mapBottom}
      onCenterChange={(ll) => setCenterLatLng(ll)}
      onMoveStart={() => setIsDraggingMap(true)}
      onMoveEnd={() => setIsDraggingMap(false)}
      
      // Biz yangi yaratgan o'zgaruvchilarni prop sifatida beramiz:
      routeLine={RouteLine}
      searchingOverlay={SearchingOverlay}
      driverOverlay={DriverOverlay}
      centerPin={CenterPin}
      
      // Markerlar (Start/Finish)
      pickupMarker={step !== 'main' && pickup.latlng ? pickup.latlng : null}
      destMarker={destination.latlng}
    />
  );

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative", overflow: "hidden" }}>
      {Styles} {/* CSS ni qo'shish */}
      
      {/* 1. XARITA QISMI */}
      {MapUI}
      
      {/* 2. HEADER QISMI */}
      {Header}

      {/* 3. PASTKI QISMLAR (SHEETS) */}
      
      {/* A. MAIN STEP */}
      {step === "main" && (
        <div style={{
            position: "absolute", bottom: 0, width: "100%", 
            background: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20,
            padding: 20, zIndex: 1100, boxShadow: "0 -2px 10px rgba(0,0,0,0.1)"
        }}>
           <Typography.Title level={4}>Qayerga borasiz?</Typography.Title>
           <Input 
             prefix={<EnvironmentOutlined style={{color: "#faad14"}}/>} 
             placeholder="Manzilni kiriting..." 
             onClick={() => setStep("search")}
           />
           <Button type="primary" block size="large" style={{marginTop: 15}} onClick={handleConfirmPickup}>
              Shu yerdan ketish
           </Button>
        </div>
      )}

      {/* B. SEARCH STEP */}
      <Drawer
        placement="bottom"
        open={step === "search"}
        height="85vh"
        closable={false}
        mask={false}
        styles={{ body: { padding: 0 } }} // antd yangi versiyasida bodyStyle -> styles.body
      >
         <TaxiSearchSheet 
            pickup={pickup}
            destination={destination}
            onPickupChange={setPickup}
            onDestChange={setDestination}
            onSelectFromMap={() => setStep("dest_map")}
            onReadyRoute={handleRouteRequest}
            onBack={() => setStep("main")}
         />
      </Drawer>

      {/* C. ROUTE PRICE STEP */}
      {step === "route" && routeData && (
        <div style={{
            position: "absolute", bottom: 0, width: "100%", 
            background: "#fff", padding: 20, zIndex: 1100,
            borderTopLeftRadius: 20, borderTopRightRadius: 20
        }}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 15}}>
                <div>
                    <Typography.Text type="secondary">Start (Ekonom)</Typography.Text>
                    <Typography.Title level={3} style={{margin: 0}}>{routeData.price.toLocaleString()} so'm</Typography.Title>
                </div>
                <Avatar size={50} src="/car-icon.png" icon={<CarOutlined />} />
            </div>
            <Button type="primary" block size="large" style={{height: 50, fontSize: 18}} onClick={handleOrderStart}>
                Buyurtma berish
            </Button>
        </div>
      )}

      {/* D. COMING (DRIVER) STEP */}
      {step === "coming" && activeOrder && (
         <div style={{
            position: "absolute", bottom: 0, width: "100%", 
            background: "#fff", padding: 20, zIndex: 1100,
            borderTopLeftRadius: 20, borderTopRightRadius: 20
        }}>
            <div style={{display: 'flex', alignItems: 'center', gap: 15}}>
                <Avatar size={64} icon={<UserOutlined />} />
                <div>
                    <Typography.Title level={4} style={{margin: 0}}>{activeOrder.driverName}</Typography.Title>
                    <Typography.Text>{activeOrder.car} • <b>{activeOrder.number}</b></Typography.Text>
                    <div style={{marginTop: 5}}><StarFilled style={{color: "gold"}}/> 4.9</div>
                </div>
                <div style={{marginLeft: "auto"}}>
                    <Button shape="circle" icon={<PhoneOutlined />} size="large" />
                </div>
            </div>
        </div>
      )}

    </div>
  );
}