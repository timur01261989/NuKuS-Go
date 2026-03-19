import React, { useMemo } from "react";
import AppRouter from "./app/router/AppRouter.jsx";
import Loader from "./modules/shared/components/Loader.jsx";
import { useAuth } from "./modules/shared/auth/AuthProvider.jsx";
import { selectAccessState } from "./modules/shared/auth/accessState.js";

function AppComponent() {
  const auth = useAuth();

  const appState = useMemo(() => {
    // 1-HIMOYA: Auth context mavjudligini tekshirish
    if (!auth) {
      console.error("Auth context is missing! Check AuthProvider wrapping.");
      return { status: "loading", role: null };
    }

    try {
      const access = selectAccessState(auth);

      // 2-HIMOYA: selectAccessState natijasini tekshirish
      if (!access || access.mode === "loading") {
        return { status: "loading", role: null };
      }

      return {
        status: access.mode === "guest" ? "guest" : "ready",
        role: access.appRole || null,
      };
    } catch (err) {
      // 3-HIMOYA: Mantiqiy xatoliklarni tutib qolish
      console.error("Access state selection failed:", err);
      return { status: "loading", role: null };
    }
  }, [auth]);

  // Agar yuklanish jarayonida bo'lsa yoki auth hali kelmagan bo'lsa Loader chiqarish
  if (appState.status === "loading") {
    return <Loader />;
  }

  // Faqat holat aniq bo'lgandagina routerni ishga tushirish
  return <AppRouter appRole={appState.role} />;
}

// React.memo renderlarni optimallashtirish uchun qoladi
export default React.memo(AppComponent);