import React from "react";
import { Select } from "antd";
import { UZ_REGIONS, getDistrictsByRegionId } from "../constants/uzLocations";

const { Option } = Select;

export default function RegionDistrictSelect({
  regionId,
  district,
  onRegionChange,
  onDistrictChange,
  allowEmptyDistrict = true,
  regionPlaceholder = "Viloyatni tanlang",
  districtPlaceholder = "Tumanni tanlang (ixtiyoriy)",
  size = "large",
  style,
}) {
  const districts = React.useMemo(() => getDistrictsByRegionId(regionId), [regionId]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, ...style }}>
      <Select
        size={size}
        value={regionId || undefined}
        placeholder={regionPlaceholder}
        onChange={(v) => onRegionChange?.(v)}
        showSearch
        optionFilterProp="children"
      >
        {UZ_REGIONS.map((r) => (
          <Option key={r.id} value={r.id}>{r.name}</Option>
        ))}
      </Select>

      <Select
        size={size}
        value={district || undefined}
        placeholder={districtPlaceholder}
        onChange={(v) => onDistrictChange?.(v || "")}
        disabled={!regionId}
        showSearch
        allowClear
        optionFilterProp="children"
      >
        {allowEmptyDistrict ? <Option value="">(Tanlanmagan)</Option> : null}
        {districts.map((d) => (
          <Option key={d} value={d}>{d}</Option>
        ))}
      </Select>
    </div>
  );
}
