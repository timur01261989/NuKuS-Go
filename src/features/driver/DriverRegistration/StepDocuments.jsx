import React, { useMemo } from "react";
import { uploadSections } from "./uploadConfig";
import { readableFileSize } from "./helpers";
import { validateDocumentsStep, hasErrors } from "./validation";

export default function StepDocuments({ files, previews, errors = {}, setStepErrors, updateFiles, onBack, onSubmit, submitting = false }) {
  const handleFileChange = (key, file) => {
    updateFiles({ [key]: file || null });
    if (errors[key]) {
      setStepErrors("documents", { ...errors, [key]: undefined });
    }
  };

  const handleSubmit = () => {
    const nextErrors = validateDocumentsStep(files);
    setStepErrors("documents", nextErrors);
    if (!hasErrors(nextErrors)) onSubmit();
  };

  return (
    <div className="rounded-3xl bg-slate-900 text-white shadow-xl">
      <div className="p-6 md:p-8">
        <Header step={3} title="Hujjatlar" />
        {uploadSections.map((section, idx) => (
          <div key={idx} className="mt-8">
            <h3 className="text-lg font-semibold text-slate-100">{section.title}</h3>
            <p className="text-xs text-slate-400">{section.description}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {section.fields.map((field) => (
                <UploadCard
                  key={field.key}
                  label={field.label}
                  required={field.required}
                  error={errors[field.key]}
                  file={files[field.key]}
                  preview={previews[field.key]}
                  submitting={submitting}
                  onChange={(f) => handleFileChange(field.key, f)}
                />
              ))}
            </div>
          </div>
        ))}

        <div className="mt-10 flex justify-between">
          <button onClick={onBack} disabled={submitting} className="rounded-xl border border-slate-700 px-6 py-3 text-sm font-medium transition hover:bg-slate-800 disabled:opacity-50">Ortga</button>
          <button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2 rounded-xl bg-cyan-500 px-10 py-3 text-sm font-bold text-slate-900 transition hover:bg-cyan-400 disabled:opacity-50">
            {submitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent"></div> : null}
            Arizani yuborish
          </button>
        </div>
      </div>
    </div>
  );
}

function Header({ step, title }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Haydovchi arizasi</h1>
      <p className="mt-2 text-sm text-slate-300">Hujjatlar va mashina rasmlarini yuklang.</p>
      <div className="mt-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500 font-bold text-white">{step}</div>
        <div className="text-base font-semibold text-cyan-300">{title}</div>
      </div>
    </div>
  );
}

function UploadCard({ label, required, error, file, preview, onChange, submitting }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border ${error ? 'border-rose-500/50 bg-rose-500/5' : 'border-slate-700 bg-slate-800'} p-4 transition`}>
      <div className="mb-3 text-sm font-medium text-slate-100">
        {required ? <span className="mr-1 text-rose-400">*</span> : null}{label}
      </div>
      
      <div className="relative mb-3 h-40 w-full overflow-hidden rounded-xl bg-slate-900">
        {preview ? (
          <img src={preview} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-slate-500">
            <svg className="mb-2 h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="text-xs">Rasm tanlanmagan</span>
          </div>
        )}
        
        {/* Loading Overlay */}
        {submitting && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent"></div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {file && (
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="truncate max-w-[120px]">{file.name}</span>
            <span>{readableFileSize(file.size)}</span>
          </div>
        )}
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-slate-700 py-2 text-xs font-semibold text-white transition hover:bg-slate-600">
          <input type="file" className="hidden" accept="image/*" onChange={(e) => onChange(e.target.files[0])} disabled={submitting} />
          <span>{file ? 'O‘zgartirish' : 'Yuklash'}</span>
        </label>
      </div>
      {error ? <span className="mt-2 block text-[10px] text-rose-400 font-medium">{error}</span> : null}
    </div>
  );
}