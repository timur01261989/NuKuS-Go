import React, { useMemo } from "react";
import { Select } from "antd";
import { UZ_REGIONS, getDistrictOptions } from "@shared/geo/uzGeo";

/**
 * Reusable Region + District selectors.
 * - district has an empty option ("—") so user can clear it.
 * - districts depend on selected region.
 */
export default function RegionDistrictFields({
  regionValue,
  districtValue,
  onRegion,
  onDistrict,
  regionPlaceholder = "Viloyat / Hudud",
  districtPlaceholder = "Tuman (ixtiyoriy)",
}) {
  const regionOptions = useMemo(
    () => UZ_REGIONS.map((r) => ({ value: r.value, label: r.label })),
    []
  );

  const districtOptions = useMemo(() => getDistrictOptions(regionValue), [regionValue]);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <Select
        value={regionValue || undefined}
        placeholder={regionPlaceholder}
        options={regionOptions}
        onChange={(v) => {
          onRegion?.(v);
          // reset district if region changed
          onDistrict?.("");
        }}
        showSearch
        optionFilterProp="label"
      />

      <Select
        value={districtValue === "" ? "" : districtValue || undefined}
        placeholder={districtPlaceholder}
        options={districtOptions}
        onChange={(v) => onDistrict?.(v)}
        disabled={!regionValue}
        showSearch
        optionFilterProp="label"
      />
    </div>
  );
}
