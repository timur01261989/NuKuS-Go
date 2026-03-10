import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import StepPersonal from "./StepPersonal";
import StepVehicle from "./StepVehicle";
import StepDocuments from "./StepDocuments";
import {
  initialErrorsState,
  initialFilesState,
  initialFormState,
} from "./initialState";
import {
  buildApplicationPayload,
  buildExistingPreview,
  fileToPreview,
  revokePreview,
} from "./helpers";
import { DOC_TYPE_TO_FIELD_KEY_MAP, DRIVER_DOCUMENT_FIELDS } from "./uploadConfig";

const STORAGE_BUCKET = "driver-documents";

export default function DriverRegister() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialFormState);
  const [files, setFiles] = useState(initialFilesState);
  const [persistedDocuments, setPersistedDocuments] = useState({});
  const [stepErrors, setStepErrorsState] = useState(initialErrorsState);
  const [submitting, setSubmitting] = useState(false);
  const [bootstrapLoading, setBootstrapLoading] = useState(true);
  const [fatalError, setFatalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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
      setSuccessMessage("");

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        const user = session?.user || null;
        if (!alive) return;

        if (!user) {
          setFatalError("Ro'yxatdan o'tish uchun avval tizimga kiring.");
          return;
        }

        const { data: existingApp, error: existingError } = await supabase
          .from("driver_applications")
          .select("id, user_id, first_name, last_name, phone, vehicle_type, brand, model, plate_number, status, created_at")
          .eq("user_id", user.id)
          .maybeSingle();

        if (existingError) throw existingError;
        if (!alive) return;

        if (existingApp) {
          setFormData((prev) => ({
            ...prev,
            lastName: existingApp.last_name || prev.lastName,
            firstName: existingApp.first_name || prev.firstName,
            phone: (existingApp.phone || "").replace(/^\+998/, "") || prev.phone,
            vehicleType: existingApp.vehicle_type || prev.vehicleType,
            brand: existingApp.brand || prev.brand,
            model: existingApp.model || prev.model,
            plateNumber: existingApp.plate_number || prev.plateNumber,
          }));

          const { data: docs, error: docsError } = await supabase
            .from("driver_documents")
            .select("id, application_id, user_id, doc_type, file_path, file_url, file_size, mime_type, created_at")
            .eq("application_id", existingApp.id)
            .order("created_at", { ascending: true });

          if (docsError) throw docsError;
          if (!alive) return;

          const normalized = normalizePersistedDocuments(docs || []);
          setPersistedDocuments(normalized);
        }
      } catch (error) {
        console.error("[DriverRegister bootstrap error]", error);
        if (alive) {
          setFatalError(
            error?.message || "Driver register ma'lumotlarini yuklab bo'lmadi."
          );
        }
      } finally {
        if (alive) setBootstrapLoading(false);
      }
    }

    bootstrap();

    return () => {
      alive = false;
    };
  }, []);

  const updateForm = (patch) => {
    setFormData((prev) => ({ ...prev, ...patch }));
  };

  const updateFiles = (patch) => {
    setFiles((prev) => ({ ...prev, ...patch }));

    const keys = Object.keys(patch || {});
    if (keys.length) {
      setPersistedDocuments((prev) => {
        const next = { ...prev };
        keys.forEach((key) => {
          if (patch[key]) {
            delete next[key];
          }
        });
        return next;
      });
    }
  };

  const setStepErrors = (section, nextErrors) => {
    setStepErrorsState((prev) => ({
      ...prev,
      [section]: sanitizeErrors(nextErrors),
    }));
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    setSubmitting(true);
    setFatalError("");
    setSuccessMessage("");

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      const user = session?.user || null;
      if (!user) {
        throw new Error("Sessiya topilmadi. Avval qayta login qiling.");
      }

      const applicationPayload = buildApplicationPayload(formData, user.id);

      const { data: applicationRow, error: upsertError } = await supabase
        .from("driver_applications")
        .upsert(applicationPayload, { onConflict: "user_id" })
        .select("id, user_id, first_name, last_name, phone, vehicle_type, brand, model, plate_number, status, created_at")
        .single();

      if (upsertError) throw upsertError;

      const uploadedDocs = {};

      for (const field of DRIVER_DOCUMENT_FIELDS) {
        const file = files[field.key];
        if (!file) continue;

        const path = createStoragePath(user.id, applicationRow.id, field, file);

        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(path, file, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`${field.label} yuklashda xato: ${uploadError.message}`);
        }

        const { data: publicData } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(path);

        const docPayload = {
          application_id: applicationRow.id,
          user_id: user.id,
          doc_type: field.docType,
          file_path: path,
          file_url: publicData?.publicUrl || null,
          file_size: file.size || null,
          mime_type: file.type || null,
        };

        const existingDocument = persistedDocuments[field.key];

        if (existingDocument?.id) {
          const { error: updateDocError } = await supabase
            .from("driver_documents")
            .update(docPayload)
            .eq("id", existingDocument.id);

          if (updateDocError) {
            throw new Error(
              `${field.label} ma'lumotini yangilashda xato: ${updateDocError.message}`
            );
          }
        } else {
          const { error: insertDocError } = await supabase
            .from("driver_documents")
            .insert(docPayload);

          if (insertDocError) {
            throw new Error(
              `${field.label} ma'lumotini saqlashda xato: ${insertDocError.message}`
            );
          }
        }

        uploadedDocs[field.key] = {
          id: existingDocument?.id || null,
          path,
          publicUrl: publicData?.publicUrl || null,
          name: file.name || null,
          size: file.size || null,
          type: file.type || null,
          docType: field.docType,
        };
      }

      const mergedDocuments = {
        ...persistedDocuments,
        ...uploadedDocs,
      };

      setPersistedDocuments(mergedDocuments);
      setFiles(initialFilesState);
      setSuccessMessage("Ariza muvaffaqiyatli yuborildi.");
    } catch (error) {
      console.error("[DriverRegister submit error]", error);
      setFatalError(error?.message || "Arizani yuborishda xato yuz berdi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (bootstrapLoading) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-3xl bg-slate-900 p-8 text-white">
          Yuklanmoqda...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      {fatalError ? (
        <div className="mb-4 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {fatalError}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mb-4 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {step === 1 ? (
        <StepPersonal
          formData={formData}
          errors={stepErrors.personal}
          setStepErrors={setStepErrors}
          updateForm={updateForm}
          onNext={nextStep}
          onBack={() => window.history.back()}
        />
      ) : null}

      {step === 2 ? (
        <StepVehicle
          formData={formData}
          errors={stepErrors.vehicle}
          setStepErrors={setStepErrors}
          updateForm={updateForm}
          onNext={nextStep}
          onBack={prevStep}
        />
      ) : null}

      {step === 3 ? (
        <StepDocuments
          files={files}
          previews={Object.fromEntries(
            Object.entries(previews).map(([key, url]) => [
              key,
              url
                ? {
                    url,
                    name: files[key]?.name || null,
                    size: files[key]?.size || null,
                    type: files[key]?.type || null,
                  }
                : null,
            ])
          )}
          persistedDocuments={persistedDocuments}
          errors={stepErrors.documents}
          setStepErrors={setStepErrors}
          updateFiles={updateFiles}
          updatePreviews={() => {}}
          onBack={prevStep}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      ) : null}
    </div>
  );
}

function normalizePersistedDocuments(documents = []) {
  return documents.reduce((acc, item) => {
    const fieldKey = DOC_TYPE_TO_FIELD_KEY_MAP[item.doc_type];
    if (!fieldKey) return acc;

    const preview = buildExistingPreview(item);

    acc[fieldKey] = {
      id: item.id,
      path: item.file_path || null,
      publicUrl: item.file_url || null,
      name: preview?.name || null,
      size: item.file_size || null,
      type: item.mime_type || null,
      docType: item.doc_type,
      url: item.file_url || null,
    };

    return acc;
  }, {});
}

function createStoragePath(userId, applicationId, field, file) {
  const safeUserId = String(userId || "unknown-user").replace(/[^a-zA-Z0-9_-]/g, "_");
  const safeApplicationId = String(applicationId || "unknown-app").replace(/[^a-zA-Z0-9_-]/g, "_");
  const ext = getFileExtension(file);
  const ts = Date.now();
  return `${safeUserId}/${safeApplicationId}/${field.docType}/${ts}.${ext}`;
}

function getFileExtension(file) {
  const name = String(file?.name || "").toLowerCase();
  const fileType = String(file?.type || "").toLowerCase();

  if (name.includes(".")) {
    return name.split(".").pop() || "jpg";
  }

  if (fileType.includes("png")) return "png";
  if (fileType.includes("webp")) return "webp";
  return "jpg";
}

function sanitizeErrors(errorMap = {}) {
  return Object.entries(errorMap || {}).reduce((acc, [key, value]) => {
    if (value) acc[key] = value;
    return acc;
  }, {});
}
