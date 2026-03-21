import React, { memo } from "react";

function TaxiMapSection({ stylesNode, mapNode, headerNode }) {
  return (
    <>
      {stylesNode}
      {mapNode}
      {headerNode}
    </>
  );
}

export default memo(TaxiMapSection);
