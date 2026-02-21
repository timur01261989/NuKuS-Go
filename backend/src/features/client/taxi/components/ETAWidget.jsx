import React from "react";

/** Small ETA bubble */
export default function ETAWidget({ etaMin }) {
  if (etaMin == null) return null;
  return <div className="yg-eta">{etaMin} daq</div>;
}
