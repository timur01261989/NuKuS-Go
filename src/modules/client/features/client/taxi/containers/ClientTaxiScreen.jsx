import React, { memo } from "react";
import TaxiMapSection from "./TaxiMapSection";
import TaxiOrderPanel from "./TaxiOrderPanel";
import TaxiActiveOrderSection from "./TaxiActiveOrderSection";

function ClientTaxiScreen({
  step,
  stylesNode,
  mapNode,
  headerNode,
  mainSheet,
  destMapSheet,
  routeSheet,
  searchingSheet,
  comingSheet,
  overlaysNode,
  modalsNode,
  timelineNode,
  ratingNode,
  bonusNode,
}) {
  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <TaxiMapSection stylesNode={stylesNode} mapNode={mapNode} headerNode={headerNode} />
      <TaxiOrderPanel
        currentStep={step}
        mainSheet={mainSheet}
        destMapSheet={destMapSheet}
        routeSheet={routeSheet}
        searchingSheet={searchingSheet}
        comingSheet={comingSheet}
      />
      <TaxiActiveOrderSection
        overlaysNode={overlaysNode}
        modalsNode={modalsNode}
        timelineNode={timelineNode}
        ratingNode={ratingNode}
        bonusNode={bonusNode}
      />
    </div>
  );
}

export default memo(ClientTaxiScreen);
