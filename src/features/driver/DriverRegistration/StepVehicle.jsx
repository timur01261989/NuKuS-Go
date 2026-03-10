import React from "react";
import { vehicleTypeOptions } from "./uploadConfig";
import { normalizePlateNumber } from "./helpers";
import { validateVehicleStep, hasErrors } from "./validation";

export default function StepVehicle({
  formData,
  errors = {},
  setStepErrors,
  updateForm,
  onNext,
  onBack,
}) {
  const handleChange = (key, value) => {
    let nextValue = value;

    if (key === "plateNumber") {
      nextValue = normalizePlateNumber(value);
    }

    updateForm({ [key]: nextValue });

    if (errors[key]) {
      setStepErrors("vehicle", { ...errors, [key]: undefined });
    }
  };

  const handleNext = () => {
    const nextErrors = validateVehicleStep(formData);
    setStepErrors("vehicle", nextErrors);
    if (!hasErrors(nextErrors)) onNext();
  };

  return (
    <div className="rounded-3xl bg-slate-900 text-white shadow-xl">
      <div className="p-6 md:p-8">
        <Header step={2} title="Transport turi" />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <SelectField
            label="Transport turi"
            required
            value={formData.vehicleType}
            options={vehicleTypeOptions}
            error={errors.vehicleType}
            onChange={(v) => handleChange("vehicleType", v)}
          />
          <Field
            label="Mashina markasi"
            required
            placeholder="Masalan: Chevrolet"
            value={formData.brand}
            error={errors.brand}
            onChange={(v) => handleChange("brand", v)}
          />
          <Field
            label="Model"
            required
            placeholder="Masalan: Nexia 3"
            value={formData.model}
            error={errors.model}
            onChange={(v) => handleChange("model", v)}
          />
          <Field
            label="Davlat raqami"
            required
            placeholder="01A777AA"
            value={formData.plateNumber}
            error={errors.plateNumber}
            onChange={(v) => handleChange("plateNumber", v)}
          />
        </div>
        <div className="mt-8 flex justify-between">
          <button
            onClick={onBack}
            className="rounded-xl border border-slate-700 px-6 py-3 text-sm font-medium transition hover:bg-slate-800"
          >
            Ortga
          </button>
          <button
            onClick={handleNext}
            className="rounded-xl bg-cyan-500 px-10 py-3 text-sm font-bold text-slate-900 transition hover:bg-cyan-400"
          >
            Keyingi
          </button>
        </div>
      </div>
    </div>
  );
}

function Header({ step, title }) {
  return (
    <div>
      <h1 className="text-2xl font-bold">Transport ma'lumotlari</h1>
      <p className="mt-2 text-sm text-slate-300">
        Haydaydigan mashinangiz haqida asosiy ma'lumotlarni kiriting.
      </p>
      <div className="mt-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500 font-bold text-white">
          {step}
        </div>
        <div className="text-base font-semibold text-cyan-300">{title}</div>
      </div>
    </div>
  );
}

function Field({ label, required, error, value, onChange, placeholder = "" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-slate-200">
        {required ? <span className="mr-1 text-rose-400">*</span> : null}
        {label}
      </span>
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
      />
      {error ? <span className="mt-1 block text-xs text-rose-400">{error}</span> : null}
    </label>
  );
}

function SelectField({ label, required, error, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-slate-200">
        {required ? <span className="mr-1 text-rose-400">*</span> : null}
        {label}
      </span>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl border border-slate-700 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%2394a3b8%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
      >
        <option value="" disabled className="bg-slate-900">
          Tanlang...
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-slate-900">
            {opt.label}
          </option>
        ))}
      </select>
      {error ? <span className="mt-1 block text-xs text-rose-400">{error}</span> : null}
    </label>
  );
}
