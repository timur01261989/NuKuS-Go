import React from "react";
import { TaxiProvider } from "./context/TaxiProvider";
import CityTaxiPageInner from "./CityTaxiPageInner";

/**
 * 🚪 CityTaxiPage.jsx
 * Driver City Taxi modulining kirish sahifasi.
 * - Provider (context+reducer) ni ulaydi
 * - UI ni CityTaxiPageInner ga beradi
 */
export default function CityTaxiPage() {
  return (
    <TaxiProvider>
      <CityTaxiPageInner />
    </TaxiProvider>
  );
}
