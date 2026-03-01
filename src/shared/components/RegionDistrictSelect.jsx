import React, { useMemo } from "react";
import { Select } from "antd";
import { UZ_REGIONS } from "../constants/uzRegions";

/**
 * Region + District selector (District optional)
 * Props:
 * - label: string
 * - region: string | null
 * - district: string | null
 * - onChange: ({region, district}) => void
 * - allowEmptyDistrict: boolean (default true)
 * - className
 */
export default function RegionDistrictSelect({
  label,
  region,
  district,
  onChange,
  allowEmptyDistrict = true,
  className,
}) {
  const regionOptions = useMemo(
    () => UZ_REGIONS.map((r) => ({ label: r.name, value: r.name })),
    []
  );

  const districts = useMemo(() => {
    const r = UZ_REGIONS.find((x) => x.name === region);
    return r?.districts || [];
  }, [region]);

  const districtOptions = useMemo(() => {
    const opts = districts.map((d) => ({ label: d, value: d }));
    if (allowEmptyDistrict) {
      return [{ label: "— (tumansiz)", value: "" }, ...opts];
    }
    return opts;
  }, [districts, allowEmptyDistrict]);

  return (
    <div className={className}>
      {label ? <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>{label}</div> : null}

      <Select
        value={region || undefined}
        placeholder="Viloyat / Qoraqalpogʻiston"
        options={regionOptions}
        onChange={(val) => onChange({ region: val, district: "" })}
        style={{ width: "100%", marginBottom: 10 }}
        showSearch
        optionFilterProp="label"
      />

      <Select
        value={district === "" ? "" : (district || undefined)}
        placeholder={allowEmptyDistrict ? "Tuman (ixtiyoriy)" : "Tuman"}
        options={districtOptions}
        onChange={(val) => onChange({ region: region || "", district: val })}
        style={{ width: "100%" }}
        disabled={!region}
        showSearch
        optionFilterProp="label"
      />
    </div>
  );
}
