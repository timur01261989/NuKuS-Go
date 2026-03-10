import React, { memo } from "react";

function TaxiOrderPanel({ currentStep, mainSheet, destMapSheet, routeSheet, searchingSheet, comingSheet }) {
  if (currentStep === "main") return mainSheet ?? null;
  if (currentStep === "dest_map") return destMapSheet ?? null;
  if (currentStep === "route") return routeSheet ?? null;
  if (currentStep === "searching") return searchingSheet ?? null;
  if (currentStep === "coming") return comingSheet ?? null;
  return null;
}

export default memo(TaxiOrderPanel);
