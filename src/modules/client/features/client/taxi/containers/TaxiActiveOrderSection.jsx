import React, { memo } from "react";

function TaxiActiveOrderSection({ overlaysNode, modalsNode, timelineNode, ratingNode, bonusNode }) {
  return (
    <>
      {overlaysNode}
      {modalsNode}
      {timelineNode}
      {ratingNode}
      {bonusNode}
    </>
  );
}

export default memo(TaxiActiveOrderSection);
