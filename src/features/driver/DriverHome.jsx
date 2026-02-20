// src/features/driver/DriverHome.jsx

import React, { useState, useEffect } from "react";
// Arxivdan olgan fayllaringizni shu yerdan chaqiramiz:
import DriverAuth from "./components/DriverAuth"; 
import DriverProfile from "./components/DriverProfile";
import DriverOrderFeed from "./components/DriverOrderFeed";
// Agar arxivda DriverDashboard bo'lmasa, DriverOrderFeed yoki Mapni asosiy qiling

const DriverHome = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Oddiy tekshiruv: Haydovchi kirganmi?
  useEffect(() => {
    const token = localStorage.getItem("driver_token");
    if (token) setIsLoggedIn(true);
  }, []);

  if (!isLoggedIn) {
    return <DriverAuth onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Bu yerda DriverProfile yoki Asosiy ekran ochiladi */}
      <DriverProfile />
    </div>
  );
};

export default DriverHome;