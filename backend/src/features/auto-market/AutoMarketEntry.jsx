import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppProviders from "./context/AppProviders";
import FeedPage from "./pages/FeedPage";
import DetailsPage from "./pages/DetailsPage";
import FavoritesPage from "./pages/FavoritesPage";
import MyAdsPage from "./pages/MyAdsPage";
import ComparePage from "./pages/ComparePage";
import CreateAdWizard from "./components/Create/CreateAdWizard";
export default function AutoMarketEntry() {
  return (
    <AppProviders>
          <Routes>
            <Route path="/" element={<FeedPage />} />
            <Route path="/ad/:id" element={<DetailsPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/my-ads" element={<MyAdsPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/create" element={<CreateAdWizard />} />
            <Route path="*" element={<Navigate to="/auto-market" replace />} />
          </Routes>
    </AppProviders>
  );
}
