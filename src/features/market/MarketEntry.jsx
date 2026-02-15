
import React from "react";
import MarketRouter from "./MarketRouter";

/**
 * Main entry point (import qilinadi):
 * <Route path="/market/*" element={<MarketEntry/>} />
 */
export default function MarketEntry() {
  return <MarketRouter />;
}
