import React from "react";

// FIXED: missing component imports
import MainSheet from "./components/MainSheet";
import RouteSheet from "./components/RouteSheet";
import SearchingSheet from "./components/SearchingSheet";
import ComingSheet from "./components/ComingSheet";

import useTaxiOrder from "./hooks/useTaxiOrder";

export default function ClientTaxiPage() {
  const {
    step,
    totalPrice,
  } = useTaxiOrder();

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      {step === "main" && <MainSheet />}
      {step === "route" && <RouteSheet totalPrice={totalPrice} />}
      {step === "searching" && <SearchingSheet />}
      {step === "coming" && <ComingSheet />}
    </div>
  );
}
