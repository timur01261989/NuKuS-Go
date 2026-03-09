import React from "react";
import { vehicleTypeOptions } from "./uploadConfig";
import { normalizePlateNumber, normalizeYear, toIntegerString } from "./helpers";
import { validateVehicleStep, hasErrors } from "./validation";

export default function StepVehicle({ formData, errors = {}, setStepErrors, updateForm, onNext, onBack }) {
  const handleChange = (key, value) => {
    let nextValue = value;
    if (key === "plateNumber") nextValue = normalizePlateNumber(value);
    if (key === "year") nextValue = normalizeYear(value);
    if (key === "seats") nextValue = toIntegerString(value, 2);
    if (key === "cargoKg") nextValue = toIntegerString(value, 5);
    if (key === "cargoM3") nextValue = value.replace(/[^\d.]/g, "").slice(0, 8);
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
          <SelectField label="Transport turi" required value={formData.vehicleType} error={errors.vehicleType} onChange={(v) => handleChange("vehicleType", v)} options={vehicleTypeOptions} />
          <Field label="Mashina markasi" required value={formData.brand} error={errors.brand} onChange={(v) => handleChange("brand", v)} />
          <Field label="Model" required value={formData.model} error={errors.model} onChange={(v) => handleChange("model", v)} />
          <Field label="Davlat raqami" required value={formData.plateNumber} error={errors.plateNumber} onChange={(v) => handleChange("plateNumber", v)} />
          <Field label="Yil" value={formData.year} error={errors.year} onChange={(v) => handleChange("year", v)} />
          <Field label="Rangi" value={formData.color} error={errors.color} onChange={(v) => handleChange("color", v)} />
          <Field label="O'rindiqlar soni" value={formData.seats} error={errors.seats} onChange={(v) => handleChange("seats", v)} />
          <Field label="Yuk limiti (kg)" value={formData.cargoKg} error={errors.cargoKg} onChange={(v) => handleChange("cargoKg", v)} />
          <div className="md:col-span-2"><Field label="Hajm (m³)" value={formData.cargoM3} error={errors.cargoM3} onChange={(v) => handleChange("cargoM3", v)} /></div>
        </div>
        <div className="mt-4 text-xs text-slate-300">Engil mashinaga barcha xizmatlar ruxsat qilinadi, lekin freight dispatch faqat belgilangan limit ichida ko'rsatiladi.</div>
        <div className="mt-6 flex items-center justify-between">
          <button type="button" className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900" onClick={onBack}>Orqaga</button>
          <button type="button" className="rounded-full bg-cyan-500 px-5 py-2 text-sm font-semibold text-white" onClick={handleNext}>Keyingi</button>
        </div>
      </div>
    </div>
  );
}

function Header({ step, title }) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold uppercase tracking-wide">Haydovchi bo'lish uchun ariza</h1>
      <p className="mt-2 text-sm text-slate-300">Transport ma'lumotlarini to'ldiring. Keyin hujjatlarni yuklaysiz.</p>
      <div className="mt-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500 font-bold text-white">{step}</div>
        <div className="text-base font-semibold text-cyan-300">{title}</div>
      </div>
    </div>
  );
}

function Field({ label, required, error, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-slate-200">{required ? <span className="mr-1 text-rose-400">*</span> : null}{label}</span>
      <input value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-cyan-500" />
      {error ? <span className="mt-1 block text-xs text-rose-400">{error}</span> : null}
    </label>
  );
}

function SelectField({ label, required, error, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-slate-200">{required ? <span className="mr-1 text-rose-400">*</span> : null}{label}</span>
      <select value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-cyan-500">
        <option value="">Tanlang</option>
        {options.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
      {error ? <span className="mt-1 block text-xs text-rose-400">{error}</span> : null}
    </label>
  );
}
