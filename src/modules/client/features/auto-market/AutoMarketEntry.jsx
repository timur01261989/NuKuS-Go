/**
 * AutoMarketEntry.jsx
 * Asl route'lar to'liq saqlangan.
 * YANGI route'lar qo'shildi:
 *   /vikup, /barter, /garaj, /zapchast, /razborka, /battle, /analytics, /service-book
 */
import React from "react";
import { useLanguage } from "@/modules/shared/i18n/useLanguage";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAutoMarketTab } from "./hooks/useAutoMarketTab";
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
import TopUpPage          from "./pages/TopUpPage";
import BookingCheckoutPage from "./pages/BookingCheckoutPage";
import PaymentReceiptPage from "./pages/PaymentReceiptPage";
import SellerLeadsPage     from "./pages/SellerLeadsPage";
import SellerAppointmentsPage from "./pages/SellerAppointmentsPage";
import SavedSearchesPage   from "./pages/SavedSearchesPage";
import SavedAlertsPage     from "./pages/SavedAlertsPage";
import PromoteListingPage from "./pages/PromoteListingPage";
import DealerProfilePage from "./pages/DealerProfilePage";
import FinanceOffersPage from "./pages/FinanceOffersPage";
import AutoMarketNotificationsPage from "./pages/AutoMarketNotificationsPage";
import PriceHistoryPage from "./pages/PriceHistoryPage";
import NotificationRulesPage from "./pages/NotificationRulesPage";
import AutoMarketHubPage from "./pages/AutoMarketHubPage";

export default function AutoMarketEntry() {
  const { language } = useLanguage();
  useAutoMarketTab();
  return (
    <AppProviders key={language}>
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
        <Route path="/topup"        element={<TopUpPage />} />
        <Route path="/booking/:id/checkout" element={<BookingCheckoutPage />} />
        <Route path="/booking/:id/receipt" element={<PaymentReceiptPage />} />
        <Route path="/seller/leads" element={<SellerLeadsPage />} />
        <Route path="/seller/appointments" element={<SellerAppointmentsPage />} />
        <Route path="/saved-searches" element={<SavedSearchesPage />} />
        <Route path="/saved-alerts" element={<SavedAlertsPage />} />
        <Route path="/promote/:id" element={<PromoteListingPage />} />
        <Route path="/dealer/:sellerId" element={<DealerProfilePage />} />
        <Route path="/finance-offers/:id" element={<FinanceOffersPage />} />
        <Route path="/notifications" element={<AutoMarketNotificationsPage />} />
        <Route path="/notifications/rules" element={<NotificationRulesPage />} />
        <Route path="/price-history/:id" element={<PriceHistoryPage />} />
        <Route path="/hub" element={<AutoMarketHubPage />} />

        <Route path="*" element={<Navigate to="." replace />} />
      </Routes>
    </AppProviders>
  );
}
