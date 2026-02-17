import React, { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import { MarketProvider } from "./context/MarketContext";
import ErrorBoundary from "./components/Common/ErrorBoundary";
import { supabase } from "@lib/supabase";
import { useMarketStore } from "./stores/marketStore";

/**
 * 🏗️ AutoMarketEntry.jsx (Modulning "Darvozasi")
 *
 * Vazifalari:
 * 1) Routing: /auto-market ichidagi sahifalarni boshqaradi
 * 2) Context/Zustand integratsiyasi: til, filter, favorites, draft va h.k.
 * 3) Xavfsizlik: login tekshiradi (token bo'lmasa /login ga yo'naltiradi)
 * 4) Lazy loading: sahifalar kech yuklanadi (tezroq ochilish)
 * 5) ErrorBoundary: modul ichida xato bo'lsa butun ilova qulamaydi
 */

const FeedPage = lazy(() => import("./pages/FeedPage"));
const DetailsPage = lazy(() => import("./pages/DetailsPage"));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage"));
const MyAdsPage = lazy(() => import("./pages/MyAdsPage"));
const ComparePage = lazy(() => import("./pages/ComparePage"));
const CreatePage = lazy(() => import("./pages/CreatePage"));

/**
 * Minimal auth tekshiruv:
 * - localStorage'da "access_token" yoki "sb-access-token" bo'lsa -> authed deb olamiz
 * Eslatma: Sizning loyihangizda AuthContext bo'lsa, shu joyni osongina almashtirasiz.
 */
function RequireAuth({ children }) {
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!alive) return;
        if (error) {
          setAuthed(false);
        } else {
          setAuthed(!!data?.session);
        }
      } catch {
        if (!alive) return;
        setAuthed(false);
      } finally {
        if (!alive) return;
        setChecking(false);
      }
    };

    run();

    return () => {
      alive = false;
    };
  }, []);

  if (checking) return <LoadingScreen />;

  if (!authed) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

function LoadingScreen() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>Avto bozor yuklanmoqda…</div>
      <div style={{ opacity: 0.7 }}>Iltimos biroz kuting</div>
    </div>
  );
}

export default function AutoMarketEntry() {
  // Zustand store init (til va filter defaultlarini joyida ushlab turish uchun)
  const { hydrateOnce } = useMarketStore();
  useMemo(() => {
    hydrateOnce();
  }, [hydrateOnce]);

  return (
    <ErrorBoundary name="AutoMarketModule">
      <MarketProvider>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<FeedPage />} />
            <Route path="/details/:id" element={<DetailsPage />} />

            <Route
              path="/create/*"
              element={
                <RequireAuth>
                  <CreatePage />
                </RequireAuth>
              }
            />
            <Route
              path="/my-ads"
              element={
                <RequireAuth>
                  <MyAdsPage />
                </RequireAuth>
              }
            />

            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/compare" element={<ComparePage />} />

            <Route path="*" element={<Navigate to="/auto-market" replace />} />
          </Routes>
        </Suspense>
      </MarketProvider>
    </ErrorBoundary>
  );
}
