/**
 * AutoMarketEntry.jsx
 * Asl route'lar to'liq saqlangan.
 * YANGI route'lar qo'shildi:
 *   /vikup, /barter, /garaj, /zapchast, /razborka, /battle, /analytics, /service-book
 */
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppProviders from "./context/AppProviders";

// Asl sahifalar (o'zgarishsiz)
import FeedPage        from "./pages/FeedPage";
import DetailsPage     from "./pages/DetailsPage";
import FavoritesPage   from "./pages/FavoritesPage";
import MyAdsPage       from "./pages/MyAdsPage";
import ComparePage     from "./pages/ComparePage";
import CreateAdWizard  from "./components/Create/CreateAdWizard";

// YANGI sahifalar
import VikupPage          from "./pages/VikupPage";
import BarterPage         from "./pages/BarterPage";
import GarajPage          from "./pages/GarajPage";
import ZapchastPage       from "./pages/ZapchastPage";
import RazborkaPage       from "./pages/RazborkaPage";
import AutoBattlePage     from "./pages/AutoBattlePage";
import PriceAnalyticsPage from "./pages/PriceAnalyticsPage";
import ServiceBookPage    from "./pages/ServiceBookPage";

export default function AutoMarketEntry() {
  return (
    <AppProviders>
      <Routes>
        {/* Asl route'lar — o'zgarishsiz */}
        <Route path="/"          element={<FeedPage />} />
        <Route path="/ad/:id"    element={<DetailsPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/my-ads"    element={<MyAdsPage />} />
        <Route path="/compare"   element={<ComparePage />} />
        <Route path="/create"    element={<CreateAdWizard />} />

        {/* YANGI route'lar */}
        <Route path="/vikup"        element={<VikupPage />} />
        <Route path="/barter"       element={<BarterPage />} />
        <Route path="/garaj"        element={<GarajPage />} />
        <Route path="/zapchast"     element={<ZapchastPage />} />
        <Route path="/razborka"     element={<RazborkaPage />} />
        <Route path="/battle"       element={<AutoBattlePage />} />
        <Route path="/analytics"    element={<PriceAnalyticsPage />} />
        <Route path="/service-book" element={<ServiceBookPage />} />

        <Route path="*" element={<Navigate to="/auto-market" replace />} />
      </Routes>
    </AppProviders>
  );
}
