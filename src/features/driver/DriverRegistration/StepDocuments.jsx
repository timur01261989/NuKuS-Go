import React, { useMemo } from "react";
import { uploadSections } from "./uploadConfig";
import { readableFileSize } from "./helpers";
import { validateDocumentsStep, hasErrors } from "./validation";

export default function StepDocuments({
  files,
  previews,
  persistedDocuments = {},
  errors = {},
  setStepErrors,
  updateFiles,
  onBack,
  onSubmit,
  submitting = false,
}) {
  const allFields = useMemo(
    () => uploadSections.flatMap((section) => section.fields),
    []
  );

  const requiredCount = useMemo(
    () => allFields.filter((field) => field.required).length,
    [allFields]
  );

  const uploadedRequiredCount = useMemo(() => {
    const requiredKeys = allFields
      .filter((field) => field.required)
      .map((field) => field.key);

    return requiredKeys.filter(
      (key) => files?.[key] || persistedDocuments?.[key]
    ).length;
  }, [allFields, files, persistedDocuments]);

  const handleFileChange = (key, file) => {
    updateFiles({ [key]: file || null });

    if (errors[key]) {
      setStepErrors("documents", {
        ...errors,
        [key]: undefined,
      });
    }
  };

  const handleSubmit = () => {
    const validationTarget = {
      ...persistedDocuments,
      ...files,
    };

    const nextErrors = validateDocumentsStep(validationTarget);
    setStepErrors("documents", nextErrors);

    if (!hasErrors(nextErrors)) {
      onSubmit();
    }
  };

  return (
    <div className="rounded-3xl bg-slate-900 text-white shadow-xl">
      <div className="p-6 md:p-8">
        <Header step={3} title="Hujjatlar" />

        <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-200">
          Majburiy hujjatlar yuklandi: <strong>{uploadedRequiredCount}/{requiredCount}</strong>
        </div>

        <div className="mt-6 space-y-6">
          {uploadSections.map((section) => (
            <div
              key={section.title}
              className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
            >
              <div className="mb-4">
                <h3 className="text-lg font-bold text-cyan-300">
                  {section.title}
                </h3>
                <p className="text-sm text-slate-300">{section.description}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {section.fields.map((field) => (
                  <UploadCard
                    key={field.key}
                    label={field.label}
                    required={field.required}
                    error={errors[field.key]}
                    file={files?.[field.key] || null}
                    preview={previews?.[field.key] || null}
                    persisted={persistedDocuments?.[field.key] || null}
                    onChange={(file) => handleFileChange(field.key, file)}
                    submitting={submitting}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
            onClick={onBack}
            disabled={submitting}
          >
            Orqaga
          </button>

          <button
            type="button"
            className="rounded-full bg-cyan-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "Yuborilmoqda..." : "Arizani yuborish"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Header({ step, title }) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold uppercase tracking-wide">
        Haydovchi bo'lish uchun ariza
      </h1>
      <p className="mt-2 text-sm text-slate-300">
        Hujjatlar va mashina rasmlarini yuklang. Car photo 1, 2, 3, 4 shu
        sahifaga tegishli.
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

function UploadCard({
  label,
  required,
  error,
  file,
  preview,
  persisted,
  onChange,
  submitting,
}) {
  const imageSrc = preview || persisted?.publicUrl || null;
  const displayName = file?.name || persisted?.name || null;
  const displaySize = file?.size ?? persisted?.size ?? null;

  return (
    <div
      className={`rounded-2xl border p-4 ${
        error
          ? "border-rose-500/50 bg-rose-500/5"
          : "border-slate-700 bg-slate-800"
      }`}
    >
      <div className="mb-3 text-sm font-medium text-slate-100">
        {required ? <span className="mr-1 text-rose-400">*</span> : null}
        {label}
      </div>

      {imageSrc ? (
        <img
          src={imageSrc}
          alt={label}
          className="mb-3 h-40 w-full rounded-xl object-cover"
        />
      ) : (
        <div className="mb-3 flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-600 text-sm text-slate-400">
          Preview yo'q
        </div>
      )}

      {displayName ? (
        <div className="mb-3 text-xs text-slate-300">
          <div className="truncate">{displayName}</div>
          <div>{displaySize ? readableFileSize(displaySize) : "Oldin yuklangan"}</div>
        </div>
      ) : null}

      <label className="inline-flex cursor-pointer items-center rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
        {file || persisted ? "Faylni almashtirish" : "Fayl tanlash"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] || null)}
          disabled={submitting}
        />
      </label>

      {persisted && !file ? (
        <div className="mt-2 text-[11px] text-emerald-400">
          Oldin yuklangan fayl mavjud
        </div>
      ) : null}

      {error ? <div className="mt-2 text-xs text-rose-400">{error}</div> : null}
    </div>
  );
}
