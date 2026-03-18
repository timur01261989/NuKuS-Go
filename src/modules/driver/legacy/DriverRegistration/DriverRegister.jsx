import React, { useEffect, useMemo, useState } from "react";
import { Form, message } from "antd";
import StepPersonal from "./StepPersonal";
import StepVehicle from "./StepVehicle";
import StepDocuments from "./StepDocuments";
import DriverPending from "./DriverPending";
import {
  initialFilesState,
  initialFormState,
  initialPreviewsState,
} from "./initialState";
import {
  buildFormDataFromApplication,
  DRIVER_DOCUMENT_FIELD_MAP,
  getMyDriverApplicationWithDocuments,
  submitDriverApplication,
} from "./supabase";
import {
  cleanupObjectUrls,
  docRowsToPreviewMap,
  normalizePhone,
} from "./helpers";
import {
  hasStepErrors,
  validateDocumentsStep,
  validatePersonalStep,
  validateVehicleStep,
} from "./validation";

import { DriverRegisterLayout, buildHeaderExtra } from "./driverRegister.helpers.jsx";

export default function DriverRegister() {
  const [form] = Form.useForm();
  const [current, setCurrent] = useState(0);
  const [files, setFiles] = useState(initialFilesState);
  const [previews, setPreviews] = useState(initialPreviewsState);
  const [existingDocuments, setExistingDocuments] = useState({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNote, setAdminNote] = useState("");

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const result = await getMyDriverApplicationWithDocuments();
        if (!mounted) return;

        if (result?.application) {
          const nextValues = buildFormDataFromApplication(result.application);
          form.setFieldsValue({
            ...initialFormState,
            ...nextValues,
            phone: normalizePhone(nextValues?.phone || ""),
            vehicleType: nextValues?.vehicleType || initialFormState.vehicleType,
          });

          setApplicationStatus(result.application.status || "");
          setRejectionReason(result.application.rejection_reason || "");
          setAdminNote(result.application.admin_note || "");
        } else {
          form.setFieldsValue(initialFormState);
          setApplicationStatus("");
          setRejectionReason("");
          setAdminNote("");
        }

        const nextPreviews = docRowsToPreviewMap(
          result?.documents || [],
          DRIVER_DOCUMENT_FIELD_MAP
        );
        setPreviews((prev) => ({ ...prev, ...nextPreviews }));

        const docsMap = (result?.documents || []).reduce((acc, item) => {
          acc[item.doc_type] = item;
          return acc;
        }, {});
        setExistingDocuments(docsMap);
      } catch (error) {
        message.error(error?.message || "Ma'lumotlarni yuklashda xato");
      } finally {
        if (mounted) setInitialLoading(false);
      }
    }

    bootstrap();

    return () => {
      mounted = false;
      cleanupObjectUrls(previews);
    };
  }, [form]);

  const updateFiles = (patch) => setFiles((prev) => ({ ...prev, ...patch }));
  const updatePreviews = (patch) =>
    setPreviews((prev) => ({ ...prev, ...patch }));

  const goNext = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue(true);

      const personalErrors = validatePersonalStep(values);
      const vehicleErrors = validateVehicleStep(values);

      if (current === 0 && hasStepErrors(personalErrors)) {
        Object.entries(personalErrors).forEach(([name, error]) =>
          form.setFields([{ name, errors: [error] }])
        );
        return;
      }

      if (current === 1 && hasStepErrors(vehicleErrors)) {
        Object.entries(vehicleErrors).forEach(([name, error]) =>
          form.setFields([{ name, errors: [error] }])
        );
        return;
      }

      setCurrent((prev) => Math.min(prev + 1, 2));
    } catch (_error) {
      // Ant Design validation handles UI error display
    }
  };

  const goPrev = () => setCurrent((prev) => Math.max(prev - 1, 0));

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue(true);

      const normalizedValues = {
        ...values,
        phone: normalizePhone(values.phone || ""),
        vehicleType: values.vehicleType || form.getFieldValue("vehicleType") || "",
      };

      if (!normalizedValues.vehicleType) {
        message.error("Transport turini tanlang");
        setCurrent(1);
        return;
      }

      const personalErrors = validatePersonalStep(normalizedValues);
      const vehicleErrors = validateVehicleStep(normalizedValues);
      const docErrors = validateDocumentsStep(files, previews);

      if (hasStepErrors(personalErrors)) {
        Object.entries(personalErrors).forEach(([name, error]) =>
          form.setFields([{ name, errors: [error] }])
        );
        setCurrent(0);
        return;
      }

      if (hasStepErrors(vehicleErrors)) {
        Object.entries(vehicleErrors).forEach(([name, error]) =>
          form.setFields([{ name, errors: [error] }])
        );
        setCurrent(1);
        return;
      }

      if (hasStepErrors(docErrors)) {
        const firstError = Object.values(docErrors)[0];
        message.error(firstError || "Hujjatlarni to'liq yuklang");
        setCurrent(2);
        return;
      }

      setSubmitting(true);

      const result = await submitDriverApplication(normalizedValues, files);
      const nextPreviews = docRowsToPreviewMap(
        result?.documents || [],
        DRIVER_DOCUMENT_FIELD_MAP
      );

      setPreviews((prev) => ({ ...prev, ...nextPreviews }));
      setFiles(initialFilesState);

      const docsMap = (result?.documents || []).reduce((acc, item) => {
        acc[item.doc_type] = item;
        return acc;
      }, {});

      setExistingDocuments(docsMap);
      setApplicationStatus(result?.application?.status || "pending");
      setRejectionReason(result?.application?.rejection_reason || "");
      setAdminNote(result?.application?.admin_note || "");
      message.success("Ariza muvaffaqiyatli yuborildi");
    } catch (error) {
      message.error(error?.message || "Arizani yuborishda xato");
    } finally {
      setSubmitting(false);
    }
  };

  const headerExtra = useMemo(
    () => buildHeaderExtra(applicationStatus, rejectionReason, adminNote),
    [applicationStatus, rejectionReason, adminNote]
  );

  if (!initialLoading && (applicationStatus === "pending" || applicationStatus === "approved")) {
    return (
      <DriverPending
        status={applicationStatus}
        rejectionReason={rejectionReason}
        adminNote={adminNote}
      />
    );
  }

  return (
    <DriverRegisterLayout
      initialLoading={initialLoading}
      current={current}
      form={form}
      files={files}
      previews={previews}
      updateFiles={updateFiles}
      updatePreviews={updatePreviews}
      existingDocuments={existingDocuments}
      submitting={submitting}
      goPrev={goPrev}
      goNext={goNext}
      handleSubmit={handleSubmit}
      headerExtra={headerExtra}
      initialFormState={initialFormState}
    />
  );
}