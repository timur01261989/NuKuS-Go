// Bridge wrapper: eski DriverHome/DriverOrderFeed ichidagi importlarni buzmaslik uchun.
// Asl modul: src/modules/driver/legacy/city-taxi/CityTaxiPage.jsx
import React from "react";
import CityTaxiPage from "../../city-taxi/CityTaxiPage";

function DriverTaxi(props) {
  return <CityTaxiPage {...props} />;
}

export default React.memo(DriverTaxi);
