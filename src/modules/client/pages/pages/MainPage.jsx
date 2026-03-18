import React from "react";
import { Button } from "antd";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { usePageI18n } from "./pageI18n";
import MapCenterPicker from "@/modules/client/features/map/components/MapCenterPicker.jsx";
import UserMarker from "@/modules/client/features/map/components/UserMarker.jsx";
import SearchRadar from "@/modules/client/features/map/components/SearchRadar.jsx";
import CenterPin from "@/modules/client/features/map/components/CenterPin.jsx";
import TargetMarker from "@/modules/client/features/map/components/TargetMarker.jsx";
import RouteLine from "@/modules/client/features/map/components/RouteLine.jsx";
import DriverMarker from "@/modules/driver/legacy/components/DriverMarker.jsx";
import {
  MainBottomSheet,
  MainMenuButton,
  MainSideMenu,
  MainTopInfoCard,
  mainPageStyles,
} from "./mainPage.sections.jsx";
import { useMainPageController } from "./useMainPageController.js";

export default function MainPage() {
  const navigate = useNavigate();
  const { t, tx } = usePageI18n();
  const {
    menuOpen,
    setMenuOpen,
    selectingFromMap,
    isSearching,
    isMoving,
    setIsMoving,
    showPricing,
    setShowPricing,
    userLoc,
    targetLoc,
    userAddress,
    targetAddress,
    distanceMeters,
    routePoints,
    distanceKm,
    priceUzs,
    haptic,
    drivers,
    showRoute,
    toggleSelecting,
    toggleSearch,
    onPickTarget,
  } = useMainPageController({ tx });

  return (
    <div style={mainPageStyles.container}>
      <MainMenuButton onClick={() => setMenuOpen(true)} />
      <MainSideMenu open={menuOpen} onClose={() => setMenuOpen(false)} navigate={navigate} t={t} tx={tx} />

      <Button onClick={() => navigate("/client")} style={mainPageStyles.backButton}>
        {t.back || tx("backLabel", "Orqaga")}
      </Button>

      <MainTopInfoCard
        tx={tx}
        userAddress={userAddress}
        targetAddress={targetAddress}
        selectingFromMap={selectingFromMap}
        isMoving={isMoving}
      />

      <MapContainer center={userLoc} zoom={16} zoomControl={false} style={{ width: "100%", height: "100%" }}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />

        {drivers.map((driver) => (
          <DriverMarker key={driver.id} position={[driver.lat, driver.lng]} />
        ))}

        {!selectingFromMap && <UserMarker position={userLoc} />}
        {!selectingFromMap && <TargetMarker position={targetLoc} visible />}

        <MapCenterPicker
          enabled={selectingFromMap}
          onPick={onPickTarget}
          onMovingChange={setIsMoving}
          onHaptic={haptic}
        />

        {showRoute && routePoints?.length > 1 ? <RouteLine points={routePoints} /> : null}
      </MapContainer>

      <CenterPin visible={selectingFromMap} isMoving={isMoving} />
      <SearchRadar isVisible={isSearching} />

      <MainBottomSheet
        tx={tx}
        selectingFromMap={selectingFromMap}
        toggleSelecting={toggleSelecting}
        isSearching={isSearching}
        toggleSearch={toggleSearch}
        distanceKm={distanceKm}
        priceUzs={priceUzs}
        showPricing={showPricing}
        setShowPricing={setShowPricing}
        targetLoc={targetLoc}
        userLoc={userLoc}
        distanceMeters={distanceMeters}
        userAddress={userAddress}
        targetAddress={targetAddress}
      />
    </div>
  );
}
