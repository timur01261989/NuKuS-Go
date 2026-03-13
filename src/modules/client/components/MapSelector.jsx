import React, { memo } from "react";
import RegionDistrictSelect from "../../shared/components/RegionDistrictSelect.jsx";

function MapSelector(props) {
  return <RegionDistrictSelect {...props} />;
}

export default memo(MapSelector);
