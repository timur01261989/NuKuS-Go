import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.memo(function Input({ label, error, leftIcon, className = "", ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>}
      <div className="relative">
        {leftIcon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{leftIcon}</div>}
        <input
          {...props}
          className={[
            "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none",
            "focus:border-primaryHome focus:ring-2 focus:ring-primaryHome/20 transition",
            leftIcon ? "pl-10" : "",
            error ? "border-red-400 bg-red-50" : "",
            className,
          ].filter(Boolean).join(" ")}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
});
