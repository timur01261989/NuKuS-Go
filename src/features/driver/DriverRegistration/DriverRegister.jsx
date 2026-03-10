import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  ConfigProvider,
  Divider,
  Form,
  Row,
  Space,
  Steps,
  Typography,
  message,
} from "antd";
import {
  CarOutlined,
  CheckCircleOutlined,
  FileImageOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import StepPersonal from "./StepPersonal";
import StepVehicle from "./StepVehicle";
import StepDocuments from "./StepDocuments";
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

const { Title, Paragraph, Text } = Typography;

const stepItems = [
  { title: "Shaxsiy ma'lumot", icon: <IdcardOutlined /> },
  { title: "Transport ma'lumotlari", icon: <CarOutlined /> },
  { title: "Hujjatlar", icon: <FileImageOutlined /> },
];

const pageStyles = {
  minHeight: "100vh",
  padding: "24px 16px",
  background:
    "radial-gradient(circle at top left, rgba(6,182,212,0.15), transparent 25%), radial-gradient(circle at top right, rgba(59,130,246,0.16), transparent 30%), linear-gradient(180deg, #020617 0%, #0f172a 50%, #111827 100%)",
};

const shellStyles = {
  maxWidth: 1180,
  margin: "0 auto",
};

const cardStyles = {
  borderRadius: 28,
  overflow: "hidden",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  background: "rgba(15, 23, 42, 0.72)",
  backdropFilter: "blur(16px)",
  boxShadow: "0 24px 80px rgba(2, 6, 23, 0.45)",
};

const heroStyles = {
  padding: 28,
  background:
    "linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(30,41,59,0.94) 35%, rgba(8,145,178,0.88) 100%)",
  borderBottom: "1px solid rgba(148, 163, 184, 0.16)",
  color: "#ffffff",
};

const contentStyles = {
  padding: 24,
};

const stepPanelStyles = {
  borderRadius: 20,
  border: "1px solid rgba(148, 163, 184, 0.16)",
  background: "linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(17,24,39,0.92) 100%)",
  padding: 20,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
};

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
          form.setFieldsValue({
            ...initialFormState,
            ...nextValues,
            phone: normalizePhone(nextValues?.phone || ""),
          });
          setApplicationStatus(result.application.status || "");
        } else {
          form.setFieldsValue(initialFormState);
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
    const values = await form.validateFields();
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
      const payload = {
        ...values,
        phone: normalizePhone(values.phone || ""),
      };
      const result = await submitDriverApplication(payload, files);
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
      message.success("Ariza muvaffaqiyatli yuborildi");
    } catch (error) {
      message.error(error?.message || "Arizani yuborishda xato");
    } finally {
      setSubmitting(false);
    }
  };

  const headerExtra = useMemo(() => {
    if (!applicationStatus) return null;
    const type =
      applicationStatus === "approved"
        ? "success"
        : applicationStatus === "rejected"
          ? "error"
          : "info";

    return (
      <Alert
        type={type}
        showIcon
        message={`Joriy holat: ${applicationStatus}`}
        style={{
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(255,255,255,0.08)",
        }}
      />
    );
  }, [applicationStatus]);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#06b6d4",
          colorText: "#e2e8f0",
          colorTextHeading: "#f8fafc",
          colorTextLabel: "#cbd5e1",
          colorBorder: "rgba(148, 163, 184, 0.22)",
          colorBgContainer: "rgba(15, 23, 42, 0.92)",
          colorFillAlter: "rgba(30, 41, 59, 0.65)",
          borderRadius: 16,
          fontSize: 15,
        },
        components: {
          Card: {
            colorBgContainer: "rgba(15, 23, 42, 0.92)",
          },
          Input: {
            colorBgContainer: "rgba(15, 23, 42, 0.95)",
            colorBorder: "rgba(148, 163, 184, 0.24)",
            activeBorderColor: "#22d3ee",
            hoverBorderColor: "#38bdf8",
            colorTextPlaceholder: "#64748b",
          },
          InputNumber: {
            colorBgContainer: "rgba(15, 23, 42, 0.95)",
            colorBorder: "rgba(148, 163, 184, 0.24)",
            activeBorderColor: "#22d3ee",
            hoverBorderColor: "#38bdf8",
            colorTextPlaceholder: "#64748b",
          },
          Select: {
            colorBgContainer: "rgba(15, 23, 42, 0.95)",
            colorBorder: "rgba(148, 163, 184, 0.24)",
            optionSelectedBg: "rgba(8, 145, 178, 0.18)",
            colorTextPlaceholder: "#64748b",
          },
          Button: {
            borderRadius: 14,
            controlHeightLG: 48,
            defaultBg: "rgba(15, 23, 42, 0.8)",
            defaultBorderColor: "rgba(148, 163, 184, 0.24)",
            defaultColor: "#e2e8f0",
            primaryShadow: "0 12px 28px rgba(6, 182, 212, 0.24)",
          },
          Steps: {
            colorTextDescription: "#94a3b8",
            colorText: "#cbd5e1",
            colorPrimary: "#22d3ee",
          },
          Alert: {
            borderRadiusLG: 16,
          },
        },
      }}
    >
      <div style={pageStyles}>
        <div style={shellStyles}>
          <Card
            loading={initialLoading}
            bordered={false}
            style={cardStyles}
            bodyStyle={{ padding: 0 }}
          >
            <div style={heroStyles}>
              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                <Text style={{ color: "rgba(255,255,255,0.68)", fontWeight: 800, letterSpacing: 1.5 }}>
                  DRIVER REGISTRATION
                </Text>
                <Title level={2} style={{ color: "#ffffff", margin: 0 }}>
                  Haydovchi bo'lib ishlash uchun ariza
                </Title>
                <Paragraph
                  style={{
                    color: "rgba(255,255,255,0.80)",
                    margin: 0,
                    maxWidth: 760,
                  }}
                >
                  Ma'lumotlarni to'ldiring, hujjatlarni yuklang va arizani yuboring.                  
                </Paragraph>
                {headerExtra}
              </Space>
            </div>

            <div style={contentStyles}>
              <div style={stepPanelStyles}>
                <Steps current={current} items={stepItems} responsive />
                <Divider style={{ borderColor: "rgba(148, 163, 184, 0.12)", margin: "20px 0" }} />

                <Form
                  form={form}
                  layout="vertical"
                  initialValues={initialFormState}
                  requiredMark={false}
                  scrollToFirstError
                >
                  {current === 0 ? <StepPersonal /> : null}
                  {current === 1 ? (
                    <StepVehicle currentYear={new Date().getFullYear()} />
                  ) : null}
                  {current === 2 ? (
                    <StepDocuments
                      files={files}
                      previews={previews}
                      updateFiles={updateFiles}
                      updatePreviews={updatePreviews}
                      existingDocuments={existingDocuments}
                      submitting={submitting}
                    />
                  ) : null}
                </Form>
              </div>

              <Divider style={{ borderColor: "rgba(148, 163, 184, 0.12)", margin: "20px 0" }} />

              <Row justify="space-between" align="middle" gutter={[12, 12]}>
                <Col>
                  {current > 0 ? (
                    <Button size="large" onClick={goPrev}>
                      Ortga
                    </Button>
                  ) : null}
                </Col>
                <Col>
                  {current < 2 ? (
                    <Button type="primary" size="large" onClick={goNext}>
                      Keyingi
                    </Button>
                  ) : (
                    <Button
                      type="primary"
                      size="large"
                      icon={<CheckCircleOutlined />}
                      loading={submitting}
                      onClick={handleSubmit}
                    >
                      Arizani yuborish
                    </Button>
                  )}
                </Col>
              </Row>
            </div>
          </Card>
        </div>
      </div>
    </ConfigProvider>
  );
}
