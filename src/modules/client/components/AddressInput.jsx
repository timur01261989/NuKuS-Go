import React, { memo, useCallback, useMemo } from "react";
import Input from "../../shared/ui/Input.jsx";
import RegionDistrictSelect from "../../shared/components/RegionDistrictSelect.jsx";

function AddressInput({
  value,
  onChange,
  region,
  district,
  onRegionChange,
  onDistrictChange,
  placeholder = "Manzil kiriting",
  disabled = false,
  className = "",
  selectorProps = {},
  inputProps = {},
}) {
  const handleValueChange = useCallback(
    (event) => {
      const nextValue = event?.target?.value ?? "";
      if (typeof onChange === "function") {
        onChange(nextValue, event);
      }
    },
    [onChange],
  );

  const mergedSelectorProps = useMemo(
    () => ({
      region,
      district,
      onRegionChange,
      onDistrictChange,
      disabled,
      ...selectorProps,
    }),
    [district, disabled, onDistrictChange, onRegionChange, region, selectorProps],
  );

  const mergedInputProps = useMemo(
    () => ({
      value: value ?? "",
      onChange: handleValueChange,
      placeholder,
      disabled,
      className: `w-full ${className}`.trim(),
      ...inputProps,
    }),
    [className, disabled, handleValueChange, inputProps, placeholder, value],
  );

  return (
    <div className="flex flex-col gap-3">
      <RegionDistrictSelect {...mergedSelectorProps} />
      <Input {...mergedInputProps} />
    </div>
  );
}

export default memo(AddressInput);
