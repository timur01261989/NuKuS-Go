// src/features/client/taxi/ClientTaxiPage.jsx
import React from "react";
import { useTaxiOrder } from "./hooks/useTaxiOrder";

export default function ClientTaxiPage() {
  const taxi = useTaxiOrder();
  return taxi.page;
}
