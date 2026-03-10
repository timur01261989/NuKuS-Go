import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Divider, Form, Row, Space, Steps, Typography, message } from "antd";
import { CarOutlined, CheckCircleOutlined, FileImageOutlined, IdcardOutlined } from "@ant-design/icons";
import StepPersonal from "./StepPersonal";
import StepVehicle from "./StepVehicle";
import StepDocuments from "./StepDocuments";
import { initialFilesState, initialFormState, initialPreviewsState } from "./initialState";
import { buildFormDataFromApplication, DRIVER_DOCUMENT_FIELD_MAP, getMyDriverApplicationWithDocuments, submitDriverApplication } from "./supabase";
import { cleanupObjectUrls, docRowsToPreviewMap, normalizePhone } from "./helpers";
import { hasStepErrors, validateDocumentsStep, validatePersonalStep, validateVehicleStep } from "./validation";

const { Title, Paragraph, Text } = Typography;
const stepItems = [
  { title: "Shaxsiy ma'lumot", icon: <IdcardOutlined /> },
  { title: "Transport ma'lumotlari", icon: <CarOutlined /> },
  { title: "Hujjatlar", icon: <FileImageOutlined /> },
];

export default function DriverRegister() {
  const [form] = Form.useForm();
  const [current, setCurrent] = useState(0);
  const [files, setFiles] = useState(initialFilesState);
  const [previews, setPreviews] = useState(initialPreviewsState);
  const [existingDocuments, setExistingDocuments] = useState({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState("");

  useEffect(() => {
    let mounted = true;
    async function bootstrap() {
      try {
        const result = await getMyDriverApplicationWithDocuments();
        if (!mounted) return;
        if (result?.application) {
          const nextValues = buildFormDataFromApplication(result.application);
          form.setFieldsValue({ ...initialFormState, ...nextValues, phone: normalizePhone(nextValues?.phone || "") });
          setApplicationStatus(result.application.status || "");
        } else {
          form.setFieldsValue(initialFormState);
        }
        const nextPreviews = docRowsToPreviewMap(result?.documents || [], DRIVER_DOCUMENT_FIELD_MAP);
        setPreviews((prev) => ({ ...prev, ...nextPreviews }));
        const docsMap = (result?.documents || []).reduce((acc, item) => { acc[item.doc_type] = item; return acc; }, {});
        setExistingDocuments(docsMap);
      } catch (error) {
        message.error(error?.message || "Ma'lumotlarni yuklashda xato");
      } finally { if (mounted) setInitialLoading(false); }
    }
    bootstrap();
    return () => { mounted = false; cleanupObjectUrls(previews); };
  }, [form]);

  const updateFiles = (patch) => setFiles((prev) => ({ ...prev, ...patch }));
  const updatePreviews = (patch) => setPreviews((prev) => ({ ...prev, ...patch }));

  const goNext = async () => {
    const values = await form.validateFields();
    const personalErrors = validatePersonalStep(values);
    const vehicleErrors = validateVehicleStep(values);
    if (current === 0 && hasStepErrors(personalErrors)) {
      Object.entries(personalErrors).forEach(([name, error]) => form.setFields([{ name, errors: [error] }]));
      return;
    }
    if (current === 1 && hasStepErrors(vehicleErrors)) {
      Object.entries(vehicleErrors).forEach(([name, error]) => form.setFields([{ name, errors: [error] }]));
      return;
    }
    setCurrent((prev) => Math.min(prev + 1, 2));
  };

  const goPrev = () => setCurrent((prev) => Math.max(prev - 1, 0));

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const docErrors = validateDocumentsStep(files, previews);
    if (hasStepErrors(docErrors)) {
      const firstError = Object.values(docErrors)[0];
      message.error(firstError || "Hujjatlarni to'liq yuklang");
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...values, phone: normalizePhone(values.phone || "") };
      const result = await submitDriverApplication(payload, files);
      const nextPreviews = docRowsToPreviewMap(result?.documents || [], DRIVER_DOCUMENT_FIELD_MAP);
      setPreviews((prev) => ({ ...prev, ...nextPreviews }));
      setFiles(initialFilesState);
      const docsMap = (result?.documents || []).reduce((acc, item) => { acc[item.doc_type] = item; return acc; }, {});
      setExistingDocuments(docsMap);
      setApplicationStatus(result?.application?.status || "pending");
      message.success("Ariza muvaffaqiyatli yuborildi");
    } catch (error) {
      message.error(error?.message || "Arizani yuborishda xato");
    } finally { setSubmitting(false); }
  };

  const headerExtra = useMemo(() => {
    if (!applicationStatus) return null;
    const type = applicationStatus === "approved" ? "success" : applicationStatus === "rejected" ? "error" : "info";
    return <Alert type={type} showIcon message={`Joriy holat: ${applicationStatus}`} />;
  }, [applicationStatus]);

  return (
    <div style={{ minHeight: "100vh", padding: 24, background: "radial-gradient(circle at top left, rgba(24,144,255,0.08), transparent 32%), radial-gradient(circle at top right, rgba(114,46,209,0.08), transparent 28%), linear-gradient(180deg, #f6f8fb 0%, #eef2f7 100%)" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <Card loading={initialLoading} bordered={false} style={{ borderRadius: 24, overflow: "hidden", boxShadow: "0 24px 60px rgba(15, 23, 42, 0.08)" }} bodyStyle={{ padding: 0 }}>
          <div style={{ padding: 28, background: "linear-gradient(135deg, rgba(19,42,76,1) 0%, rgba(31,79,155,1) 45%, rgba(24,144,255,1) 100%)", color: "#fff" }}>
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              <Text style={{ color: "rgba(255,255,255,0.72)", fontWeight: 700 }}>DRIVER REGISTRATION</Text>
              <Title level={2} style={{ color: "#fff", margin: 0 }}>Haydovchi bo'lib ishlash uchun ariza</Title>
              <Paragraph style={{ color: "rgba(255,255,255,0.78)", margin: 0 }}>Avvalgi chiroyli dizayn saqlandi, endi rasmlar avtomatik siqiladi va hujjatlar alohida driver_documents jadvaliga yoziladi.</Paragraph>
              {headerExtra}
            </Space>
          </div>
          <div style={{ padding: 24 }}>
            <Steps current={current} items={stepItems} responsive />
            <Divider />
            <Form form={form} layout="vertical" initialValues={initialFormState} requiredMark={false} scrollToFirstError>
              {current === 0 ? <StepPersonal /> : null}
              {current === 1 ? <StepVehicle currentYear={new Date().getFullYear()} /> : null}
              {current === 2 ? <StepDocuments files={files} previews={previews} updateFiles={updateFiles} updatePreviews={updatePreviews} existingDocuments={existingDocuments} submitting={submitting} /> : null}
            </Form>
            <Divider />
            <Row justify="space-between" align="middle" gutter={[12, 12]}>
              <Col>{current > 0 ? <Button size="large" onClick={goPrev}>Ortga</Button> : null}</Col>
              <Col>{current < 2 ? <Button type="primary" size="large" onClick={goNext}>Keyingi</Button> : <Button type="primary" size="large" icon={<CheckCircleOutlined />} loading={submitting} onClick={handleSubmit}>Arizani yuborish</Button>}</Col>
            </Row>
          </div>
        </Card>
      </div>
    </div>
  );
}
