import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import StepPersonal from "./StepPersonal";
import StepVehicle from "./StepVehicle";
import StepDocuments from "./StepDocuments";
import { initialErrorsState, initialFilesState, initialFormState } from "./initialState";
import { buildApplicationPayload, fileToPreview, revokePreview, uploadSingleFile } from "./helpers";

const STORAGE_BUCKET = "driver-documents";

export default function DriverRegister() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialFormState);
  const [files, setFiles] = useState(initialFilesState);
  const [stepErrors, setStepErrorsState] = useState(initialErrorsState);
  const [submitting, setSubmitting] = useState(false);
  const [bootstrapLoading, setBootstrapLoading] = useState(true);
  const [fatalError, setFatalError] = useState("");

  const previews = useMemo(() => {
    const nextPreviews = {};
    for (const [key, file] of Object.entries(files)) {
      nextPreviews[key] = file ? fileToPreview(file) : null;
    }
    return nextPreviews;
  }, [files]);

  useEffect(() => {
    return () => {
      Object.values(previews).forEach((url) => revokePreview(url));
    };
  }, [previews]);

  useEffect(() => {
    let alive = true;
    async function bootstrap() {
      setBootstrapLoading(true);
      setFatalError("");
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        const user = data?.session?.user || null;
        if (!alive) return;
        if (!user) {
          setFatalError("Ro'yxatdan o'tish uchun avval tizimga kiring.");
          return;
        }
        const { data: existingApp } = await supabase.from("driver_applications").select("*").eq("user_id", user.id).maybeSingle();
        if (!alive || !existingApp) return;
        setFormData((prev) => ({
          ...prev,
          lastName: existingApp.last_name || prev.lastName,
          firstName: existingApp.first_name || prev.firstName,
          middleName: existingApp.middle_name || prev.middleName,
          phone: (existingApp.phone || "").replace(/^\+998/, "") || prev.phone,
          passportNumber: existingApp.passport_number || prev.passportNumber,
          vehicleType: existingApp.vehicle_type || prev.vehicleType,
          brand: existingApp.brand || prev.brand,
          model: existingApp.model || prev.model,
          plateNumber: existingApp.plate_number || prev.plateNumber,
          year: existingApp.year ? String(existingApp.year) : prev.year,
          color: existingApp.color || prev.color,
          seats: existingApp.seats ? String(existingApp.seats) : prev.seats,
          cargoKg: existingApp.cargo_kg ? String(existingApp.cargo_kg) : prev.cargoKg,
          cargoM3: existingApp.cargo_m3 ? String(existingApp.cargo_m3) : prev.cargoM3,
          notes: existingApp.notes || prev.notes,
        }));
      } catch (error) {
        console.error("[DriverRegister bootstrap error]", error);
        if (alive) setFatalError(error?.message || "Driver register ma'lumotlarini yuklab bo'lmadi.");
      } finally {
        if (alive) setBootstrapLoading(false);
      }
    }
    bootstrap();
    return () => { alive = false; };
  }, []);

  const updateForm = (patch) => setFormData((prev) => ({ ...prev, ...patch }));
  const updateFiles = (patch) => setFiles((prev) => ({ ...prev, ...patch }));
  const setStepErrors = (section, nextErrors) => setStepErrorsState((prev) => ({ ...prev, [section]: sanitizeErrors(nextErrors) }));
  const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    setSubmitting(true);
    setFatalError("");
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      const user = data?.session?.user || null;
      if (!user) throw new Error("Sessiya topilmadi. Avval qayta login qiling.");
      const uploadedFilesMap = {};
      for (const [fieldKey, file] of Object.entries(files)) {
        if (!file) continue;
        uploadedFilesMap[fieldKey] = await uploadSingleFile({ supabase, bucket: STORAGE_BUCKET, userId: user.id, fieldKey, file });
      }
      const payload = buildApplicationPayload(formData, uploadedFilesMap, user.id);
      const { error: upsertError } = await supabase.from("driver_applications").upsert(payload, { onConflict: "user_id" });
      if (upsertError) throw upsertError;
      alert("Ariza muvaffaqiyatli yuborildi.");
    } catch (error) {
      console.error("[DriverRegister submit error]", error);
      setFatalError(error?.message || "Arizani yuborishda xato yuz berdi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (bootstrapLoading) {
    return <div className="mx-auto max-w-5xl p-6"><div className="rounded-3xl bg-slate-900 p-8 text-white">Yuklanmoqda...</div></div>;
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      {fatalError ? <div className="mb-4 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">{fatalError}</div> : null}
      {step === 1 ? <StepPersonal formData={formData} errors={stepErrors.personal} setStepErrors={setStepErrors} updateForm={updateForm} onNext={nextStep} onBack={() => window.history.back()} /> : null}
      {step === 2 ? <StepVehicle formData={formData} errors={stepErrors.vehicle} setStepErrors={setStepErrors} updateForm={updateForm} onNext={nextStep} onBack={prevStep} /> : null}
      {step === 3 ? <StepDocuments files={files} previews={previews} errors={stepErrors.documents} setStepErrors={setStepErrors} updateFiles={updateFiles} onBack={prevStep} onSubmit={handleSubmit} submitting={submitting} /> : null}
    </div>
  );
}

function sanitizeErrors(errorObject) {
  return Object.fromEntries(Object.entries(errorObject || {}).filter(([, value]) => Boolean(value)));
}
