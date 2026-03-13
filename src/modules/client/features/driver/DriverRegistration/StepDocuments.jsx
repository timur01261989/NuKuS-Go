import React, { useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Row,
  Space,
  Typography,
  Upload,
  message,
  Alert,
} from "antd";
import {
  CheckCircleOutlined,
  InboxOutlined,
  LoadingOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  compressImage,
  getReadableFileSize,
  isValidImageFile,
  makeFilePreview,
} from "./helpers";
import { DRIVER_DOCUMENT_FIELDS } from "./uploadConfig";

const { Text, Title } = Typography;

const previewImageStyle = {
  width: "100%",
  height: 180,
  objectFit: "cover",
  borderRadius: 14,
  border: "1px solid rgba(148, 163, 184, 0.16)",
};

const emptyBoxStyle = {
  height: 180,
  borderRadius: 14,
  border: "1px dashed rgba(148, 163, 184, 0.26)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(180deg, rgba(15,23,42,0.86) 0%, rgba(30,41,59,0.72) 100%)",
};

export default function StepDocuments({
  files,
  previews,
  updateFiles,
  updatePreviews,
  existingDocuments,
  submitting,
}) {
  const [compressingKey, setCompressingKey] = useState("");
  const orderedFields = useMemo(() => DRIVER_DOCUMENT_FIELDS, []);

  const handleFileChange = async (file, key) => {
    const config = orderedFields.find((item) => item.key === key);
    if (!file || !config) return Upload.LIST_IGNORE;

    if (!isValidImageFile(file)) {
      message.error("Faqat rasm formatidagi fayllarni yuklash mumkin");
      return Upload.LIST_IGNORE;
    }

    try {
      setCompressingKey(key);
      const compressed = await compressImage(file, {
        maxWidth: config.maxWidth,
        quality: config.quality,
      });
      updateFiles({ [key]: compressed });
      updatePreviews({ [key]: makeFilePreview(compressed) });
    } catch (error) {
      message.error(error?.message || "Rasmni qayta ishlashda xato yuz berdi");
    } finally {
      setCompressingKey("");
    }

    return Upload.LIST_IGNORE;
  };

  return (
    <Space direction="vertical" size={18} style={{ width: "100%" }}>
      <div>
        <Title level={4} style={{ marginBottom: 4, color: "#f8fafc" }}>
          Hujjatlar va rasmlar
        </Title>
        <Text style={{ color: "#94a3b8" }}>
          Iltimos, hujjatlarni yorug' joyda, yozuvlari aniq o'qiladigan qilib rasmga oling.
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        {orderedFields.map((field) => {
          const preview = previews[field.key];
          const existing = existingDocuments[field.docType];
          const isProcessing = compressingKey === field.key;

          return (
            <Col xs={24} md={12} lg={8} key={field.key}>
              <Card
                size="small"
                title={
                  <Space>
                    <span style={{ color: "#f8fafc", fontWeight: 700 }}>{field.label}</span>
                    {field.required ? <Text type="danger">*</Text> : null}
                  </Space>
                }
                bordered
                style={{
                  borderRadius: 20,
                  height: "100%",
                  border: "1px solid rgba(148, 163, 184, 0.16)",
                  background:
                    "linear-gradient(180deg, rgba(15,23,42,0.96) 0%, rgba(17,24,39,0.94) 100%)",
                  boxShadow: "0 16px 40px rgba(2, 6, 23, 0.24)",
                }}
                bodyStyle={{ padding: 16 }}
              >
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  {preview?.url ? (
                    <img src={preview.url} alt={field.label} style={previewImageStyle} />
                  ) : existing?.file_url ? (
                    <img src={existing.file_url} alt={field.label} style={previewImageStyle} />
                  ) : (
                    <div style={emptyBoxStyle}>
                      <Space direction="vertical" align="center">
                        {isProcessing ? (
                          <LoadingOutlined style={{ fontSize: 28, color: "#67e8f9" }} />
                        ) : (
                          <InboxOutlined style={{ fontSize: 28, color: "#67e8f9" }} />
                        )}
                        <Text style={{ color: "#94a3b8" }}>
                          {isProcessing ? "Rasm tayyorlanmoqda..." : "Rasm tanlanmagan"}
                        </Text>
                      </Space>
                    </div>
                  )}

                  <Upload
                    accept={field.accept}
                    beforeUpload={(file) => handleFileChange(file, field.key)}
                    showUploadList={false}
                    disabled={submitting}
                  >
                    <Button
                      block
                      icon={<UploadOutlined />}
                      loading={isProcessing}
                      size="large"
                      style={{
                        height: 46,
                        borderRadius: 14,
                        fontWeight: 700,
                      }}
                    >
                      {preview?.url || existing?.file_url
                        ? "Rasmni almashtirish"
                        : "Rasm yuklash"}
                    </Button>
                  </Upload>

                  {files[field.key] ? (
                    <Alert
                      type="success"
                      showIcon
                      icon={<CheckCircleOutlined />}
                      message={`${files[field.key].name} (${getReadableFileSize(
                        files[field.key].size
                      )})`}
                      style={{
                        borderRadius: 14,
                        background: "rgba(34, 197, 94, 0.10)",
                        border: "1px solid rgba(34, 197, 94, 0.18)",
                      }}
                    />
                  ) : existing?.file_url ? (
                    <Alert
                      type="success"
                      showIcon
                      icon={<CheckCircleOutlined />}
                      message="Oldin yuklangan rasm mavjud"
                      style={{
                        borderRadius: 14,
                        background: "rgba(34, 197, 94, 0.10)",
                        border: "1px solid rgba(34, 197, 94, 0.18)",
                      }}
                    />
                  ) : null}
                </Space>
              </Card>
            </Col>
          );
        })}
      </Row>
    </Space>
  );
}