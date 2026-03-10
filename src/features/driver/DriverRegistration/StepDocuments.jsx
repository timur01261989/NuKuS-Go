import React, { useMemo, useState } from "react";
import { uploadSections } from "./uploadConfig";
import {
  compressImage,
  isValidImageFile,
  makeFilePreview,
  readableFileSize,
} from "./helpers";
import { validateDocumentsStep, hasErrors } from "./validation";

export default function StepDocuments({
  files,
  previews,
  persistedDocuments = {},
  errors = {},
  setStepErrors,
  updateFiles,
  updatePreviews,
  onBack,
  onSubmit,
  submitting = false,
}) {
  const [processingKey, setProcessingKey] = useState("");
  const [localError, setLocalError] = useState("");

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
      (key) => files?.[key] || previews?.[key] || persistedDocuments?.[key]
    ).length;
  }, [allFields, files, previews, persistedDocuments]);

  const handleFileChange = async (key, file) => {
    setLocalError("");

    if (!file) {
      updateFiles({ [key]: null });
      updatePreviews({ [key]: null });
      return;
    }

    if (!isValidImageFile(file)) {
      setLocalError("Faqat rasm fayl yuklash mumkin");
      return;
    }

    const config = allFields.find((field) => field.key === key);
    if (!config) return;

    try {
      setProcessingKey(key);
      const compressedFile = await compressImage(file, {
        maxWidth: config.maxWidth,
        quality: config.quality,
      });

      const preview = makeFilePreview(compressedFile);

      updateFiles({ [key]: compressedFile });
      updatePreviews({ [key]: preview });

      if (errors[key]) {
        setStepErrors("documents", {
          ...errors,
          [key]: undefined,
        });
      }
    } catch (error) {
      setLocalError(error?.message || "Rasmni qayta ishlashda xato yuz berdi");
    } finally {
      setProcessingKey("");
    }
  };

  const handleSubmit = () => {
    const validationTarget = {
      ...persistedDocuments,
      ...previews,
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

        {localError ? (
          <div className="mt-4 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {localError}
          </div>
        ) : null}

        <div className="mt-6 space-y-6">
          {uploadSections.map((section) => (
            <div
              key={section.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/40"
            >
              <div className="border-b border-slate-800 px-5 py-4">
                <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{section.description}</p>
              </div>

              <div className="grid gap-4 p-5 md:grid-cols-2">
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
                    processing={processingKey === field.key}
                    maxWidth={field.maxWidth}
                    quality={field.quality}
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
            disabled={submitting || !!processingKey}
          >
            Orqaga
          </button>

          <button
            type="button"
            className="rounded-full bg-cyan-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            onClick={handleSubmit}
            disabled={submitting || !!processingKey}
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
        Hujjatlar va rasmlarni yuklang. Pasport, prava, texpasport, shaxsiy rasm va 1 ta mashina rasmi talab qilinadi.
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
  processing,
  maxWidth,
  quality,
}) {
  const imageSrc = preview?.url || persisted?.publicUrl || persisted?.url || null;
  const displayName = file?.name || preview?.name || persisted?.name || null;
  const displaySize = file?.size ?? preview?.size ?? persisted?.size ?? null;

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
          <div className="mt-1 text-[11px] text-slate-400">
            Max width: {maxWidth}px · Quality: {quality}
          </div>
        </div>
      ) : (
        <div className="mb-3 text-[11px] text-slate-400">
          Max width: {maxWidth}px · Quality: {quality}
        </div>
      )}

      <label className="inline-flex cursor-pointer items-center rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
        {processing
          ? "Rasm siqilmoqda..."
          : file || persisted || preview
            ? "Faylni almashtirish"
            : "Fayl tanlash"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] || null)}
          disabled={submitting || processing}
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
