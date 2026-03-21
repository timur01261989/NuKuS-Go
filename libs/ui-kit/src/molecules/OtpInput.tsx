import React, { useRef, useState } from "react";

interface OtpInputProps { length?: number; onChange: (value: string) => void; }

export const OtpInput = React.memo(function OtpInput({ length = 6, onChange }: OtpInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(""));
  const refs = Array.from({ length }, () => useRef<HTMLInputElement>(null));

  const handleChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...values];
    next[idx] = val;
    setValues(next);
    onChange(next.join(""));
    if (val && idx < length - 1) refs[idx + 1].current?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !values[idx] && idx > 0) refs[idx - 1].current?.focus();
  };

  return (
    <div className="flex gap-3 justify-center">
      {values.map((v, i) => (
        <input key={i} ref={refs[i]} value={v} maxLength={1} inputMode="numeric"
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-12 h-14 rounded-2xl border-2 border-slate-200 text-center text-xl font-bold outline-none focus:border-primaryHome transition"
        />
      ))}
    </div>
  );
});
