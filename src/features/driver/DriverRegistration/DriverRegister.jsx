import { useEffect, useState } from "react";
import { initialFilesState, initialFormState, initialPreviewsState } from "./initialState";
import StepPersonal from "./StepPersonal";
import StepVehicle from "./StepVehicle";
import StepDocuments from "./StepDocuments";
import { docRowsToPreviewMap } from "./helpers";
import {
  buildFormDataFromApplication,
  DRIVER_DOCUMENT_FIELD_MAP,
  getMyDriverApplicationWithDocuments,
  submitDriverApplication,
} from "./supabase";
import {
  validateDocumentsStep,
  validatePersonalStep,
  validateVehicleStep,
} from "./validation";

export default function DriverRegister() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialFormState);
  const [files, setFiles] = useState(initialFilesState);
  const [previews, setPreviews] = useState(initialPreviewsState);
  const [existingDocuments, setExistingDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        setLoading(true);
        const { application, documents } = await getMyDriverApplicationWithDocuments();

        if (!mounted) return;

        if (application) {
          const nextFormData = buildFormDataFromApplication(application);
          if (nextFormData) setFormData(nextFormData);
        }

        if (documents?.length) {
          setExistingDocuments(documents);
          setPreviews((prev) => ({
            ...prev,
            ...docRowsToPreviewMap(documents, DRIVER_DOCUMENT_FIELD_MAP),
          }));
        }
      } catch (bootstrapError) {
        if (!mounted) return;
        setError(bootstrapError?.message || "Ma'lumotlarni yuklashda xato");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  const updateForm = (patch) => {
    setFormData((prev) => ({ ...prev, ...patch }));
  };

  const updateFiles = (patch) => {
    setFiles((prev) => ({ ...prev, ...patch }));
  };

  const updatePreviews = (patch) => {
    setPreviews((prev) => ({ ...prev, ...patch }));
  };

  const nextStep = () => {
    setError("");

    if (step === 1) {
      const validationError = validatePersonalStep(formData);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    if (step === 2) {
      const validationError = validateVehicleStep(formData);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setStep((current) => Math.min(current + 1, 3));
  };

  const prevStep = () => {
    setError("");
    setStep((current) => Math.max(current - 1, 1));
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    const validationError = validateDocumentsStep(files, previews);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      await submitDriverApplication(formData, files, existingDocuments);
      setSuccess("Ariza muvaffaqiyatli yuborildi");

      const refreshed = await getMyDriverApplicationWithDocuments();
      setExistingDocuments(refreshed.documents || []);
      setPreviews((prev) => ({
        ...prev,
        ...docRowsToPreviewMap(refreshed.documents || [], DRIVER_DOCUMENT_FIELD_MAP),
      }));
      setFiles(initialFilesState);
    } catch (submitError) {
      setError(submitError?.message || "Arizani yuborishda xato");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div>Yuklanmoqda...</div>;
  }

  return (
    <div>
      {error ? <div style={{ color: "red", marginBottom: 12 }}>{error}</div> : null}
      {success ? <div style={{ color: "green", marginBottom: 12 }}>{success}</div> : null}

      {step === 1 ? (
        <StepPersonal
          formData={formData}
          updateForm={updateForm}
          onNext={nextStep}
        />
      ) : null}

      {step === 2 ? (
        <StepVehicle
          formData={formData}
          updateForm={updateForm}
          onBack={prevStep}
          onNext={nextStep}
        />
      ) : null}

      {step === 3 ? (
        <StepDocuments
          files={files}
          previews={previews}
          updateFiles={updateFiles}
          updatePreviews={updatePreviews}
          onBack={prevStep}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      ) : null}
    </div>
  );
}
