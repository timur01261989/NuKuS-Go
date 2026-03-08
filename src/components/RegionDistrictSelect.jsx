import React from "react";
import { Select } from "antd";
import { getLocalizedRegions, getLocalizedDistricts, ct } from "./shared/i18n_componentLocalize";

const { Option } = Select;

export default function RegionDistrictSelect({
  regionId,
  district,
  onRegionChange,
  onDistrictChange,
  allowEmptyDistrict = true,
  regionPlaceholder,
  districtPlaceholder,
  size = "large",
  style,
}) {
  const regions = React.useMemo(() => getLocalizedRegions(), []);
  const districts = React.useMemo(() => getLocalizedDistricts(regionId), [regionId]);
  const safeRegionPlaceholder = regionPlaceholder || ct("selectRegion", "Viloyatni tanlang");
  const safeDistrictPlaceholder = districtPlaceholder || ct("selectDistrict", "Tumanni tanlang (ixtiyoriy)");
  const notSelectedText = ct("notSelected", "(Tanlanmagan)");

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, ...style }}>
      <Select
        size={size}
        value={regionId || undefined}
        placeholder={safeRegionPlaceholder}
        onChange={(v) => onRegionChange?.(v)}
        showSearch
        optionFilterProp="children"
      >
        {regions.map((r) => (
          <Option key={r.id} value={r.id}>{r.localizedName}</Option>
        ))}
      </Select>

      <Select
        size={size}
        value={district || undefined}
        placeholder={safeDistrictPlaceholder}
        onChange={(v) => onDistrictChange?.(v || "")}
        disabled={!regionId}
        showSearch
        allowClear
        optionFilterProp="children"
      >
        {allowEmptyDistrict ? <Option value="">{notSelectedText}</Option> : null}
        {districts.map((d) => (
          <Option key={d.value} value={d.value}>{d.label}</Option>
        ))}
      </Select>
    </div>
  );
}
