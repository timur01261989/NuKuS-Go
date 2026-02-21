// src/features/driver/DriverHome.jsx

import React, { useState, useEffect } from "react";
import { Skeleton } from "antd";
import { supabase } from "@lib/supabase";

// Arxivdan olgan fayllaringizni shu yerdan chaqiramiz:
import DriverAuth from "./components/DriverAuth";
import DriverProfile from "./components/DriverProfile";
// import DriverOrderFeed from "./components/DriverOrderFeed";

const DriverHome = () => {
  const [checking, setChecking] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ✅ Supabase orqali tekshiruv: haydovchi login bo'lganmi?
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        const ok = !error && !!data?.user;
        if (!alive) return;
        setIsLoggedIn(ok);
      } finally {
        if (alive) setChecking(false);
      }
    })();

    // Session o'zgarsa (login/logout), UI darrov yangilansin
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  if (checking) {
    return (
      <div style={{ padding: 16 }}>
        <Skeleton active />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <DriverAuth onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <DriverProfile />
    </div>
  );
};

export default DriverHome;
