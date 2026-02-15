
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { MarketFilterProvider } from "./context/MarketFilterContext";
import HomeFeed from "./pages/HomeFeed";
import SearchResults from "./pages/SearchResults";
import ProductDetail from "./pages/ProductDetail";
import Favorites from "./pages/Favorites";
import MyAds from "./pages/MyAds";
import CreateAdWizard from "./pages/CreateAdWizard";
import Profile from "./pages/Profile";

export default function MarketRouter() {
  return (
    <MarketFilterProvider>
      <Routes>
        <Route path="/" element={<HomeFeed />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/ad/:id" element={<ProductDetail />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/my-ads" element={<MyAds />} />
        <Route path="/create" element={<CreateAdWizard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/market" replace />} />
      </Routes>
    </MarketFilterProvider>
  );
}
