import React, { memo } from "react";
import SurgeBadge from "./SurgeBadge.jsx";

function TaxiFareCard({ children, surgeMultiplier = 1 }) {
  return (
    <>
      <SurgeBadge multiplier={surgeMultiplier} />
      {children}
    </>
  );
}

export default memo(TaxiFareCard);
