import React, { memo } from "react";
import ClientTaxiScreen from "@/modules/client/features/client/taxi/ClientTaxiPage.jsx";

function TaxiOrder() {
  return <ClientTaxiScreen />;
}

export default memo(TaxiOrder);
