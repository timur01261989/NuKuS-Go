import React from "react";
import { normalizePhoneInput } from "./helpers";
import { validatePersonalStep, hasErrors } from "./validation";

export default function StepPersonal({
  formData,
  errors = {},
  setStepErrors,
  updateForm,
  onNext,
  onBack,
}) {
  const handleChange = (key, value) => {
    let nextValue = value;
    if (key === "phone") nextValue = normalizePhoneInput(value);

    updateForm({ [key]: nextValue });

    if (errors[key]) {
      setStepErrors("personal", { ...errors, [key]: undefined });
    }
  };

  const handleNext = () => {
    const nextErrors = validatePersonalStep(formData);
    setStepErrors("personal", nextErrors);
    if (!hasErrors(nextErrors)) onNext();
  };

  return (
    <div className="rounded-3xl bg-slate-900 text-white shadow-xl">
      <div className="p-6 md:p-8">
        <Header step={1} title="Shaxsiy ma'lumot" />

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field
            label="Familiya"
            required
            value={formData.lastName}
            error={errors.lastName}
            onChange={(v) => handleChange("lastName", v)}
          />
          <Field
            label="Ism"
            required
            value={formData.firstName}
            error={errors.firstName}
            onChange={(v) => handleChange("firstName", v)}
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-1">
          <PhoneField
            value={formData.phone}
            error={errors.phone}
            onChange={(v) => handleChange("phone", v)}
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
      <h1 className="text-2xl font-bold">Haydovchi sifatida ro'yxatdan o'tish</h1>
      <p className="mt-2 text-sm text-slate-300">
        Shaxsiy ma'lumotlaringizni kiriting. Bu ma'lumotlar ariza uchun ishlatiladi.
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

function PhoneField({ value, onChange, error }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-slate-200">
        <span className="mr-1 text-rose-400">*</span>
        Telefon (9 ta raqam)
      </span>
      <div className="flex overflow-hidden rounded-xl border border-slate-700 bg-slate-800 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20">
        <div className="flex items-center border-r border-slate-700 px-4 text-white">
          +998
        </div>
        <input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="901234567"
          className="w-full bg-transparent px-4 py-3 text-white outline-none"
          inputMode="numeric"
        />
      </div>
      {error ? <span className="mt-1 block text-xs text-rose-400">{error}</span> : null}
    </label>
  );
}
