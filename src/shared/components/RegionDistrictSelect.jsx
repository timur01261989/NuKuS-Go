import React, { useMemo } from "react";
import { Select } from "antd";
import { UZ_REGIONS } from "../constants/uzRegions";
import { useLanguage } from "@/shared/i18n/useLanguage";
import { localizeGeoLabel } from "@/shared/i18n/geo";

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
  const { language, t } = useLanguage();
  const regionOptions = useMemo(
    () => UZ_REGIONS.map((r) => ({ label: localizeGeoLabel(r.name, language), value: r.name })),
    [language]
  );

  const districts = useMemo(() => {
    const r = UZ_REGIONS.find((x) => x.name === region);
    return r?.districts || [];
  }, [region]);

  const districtOptions = useMemo(() => {
    const opts = districts.map((d) => ({ label: localizeGeoLabel(d, language), value: d }));
    if (allowEmptyDistrict) {
      return [{ label: t.noDistrictOption || "— (Tumansiz)", value: "" }, ...opts];
    }
    return opts;
  }, [districts, allowEmptyDistrict, language, t.noDistrictOption]);

  return (
    <div className={className}>
      {label ? <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>{label}</div> : null}

      <Select
        value={region || undefined}
        placeholder={t.regionPlaceholder || "Viloyat / Qoraqalpogʻiston"}
        options={regionOptions}
        onChange={(val) => onChange({ region: val, district: "" })}
        style={{ width: "100%", marginBottom: 10 }}
        showSearch
        optionFilterProp="label"
      />

      <Select
        value={district === "" ? "" : (district || undefined)}
        placeholder={allowEmptyDistrict ? (t.districtOptionalPlaceholder || "Tuman (ixtiyoriy)") : (t.districtPlaceholder || "Tuman")}
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
