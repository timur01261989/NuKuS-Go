import React, { useMemo, useState } from "react";
import { Alert, Button, Card, Col, Row, Space, Typography, Upload, message } from "antd";
import { CheckCircleOutlined, InboxOutlined, LoadingOutlined, UploadOutlined } from "@ant-design/icons";
import { compressImage, getReadableFileSize, isValidImageFile, makeFilePreview } from "./helpers";
import { DRIVER_DOCUMENT_FIELDS } from "./uploadConfig";

const { Text } = Typography;

export default function StepDocuments({ files, previews, updateFiles, updatePreviews, existingDocuments, submitting }) {
  const [compressingKey, setCompressingKey] = useState("");
  const orderedFields = useMemo(() => DRIVER_DOCUMENT_FIELDS, []);

  const handleFileChange = async (file, key) => {
    const config = orderedFields.find((item) => item.key === key);
    if (!file || !config) return Upload.LIST_IGNORE;
    if (!isValidImageFile(file)) { message.error("Faqat rasm fayl yuklash mumkin"); return Upload.LIST_IGNORE; }
    try {
      setCompressingKey(key);
      const compressed = await compressImage(file, { maxWidth: config.maxWidth, quality: config.quality });
      updateFiles({ [key]: compressed });
      updatePreviews({ [key]: makeFilePreview(compressed) });
    } catch (error) {
      message.error(error?.message || "Rasmni qayta ishlashda xato");
    } finally { setCompressingKey(""); }
    return Upload.LIST_IGNORE;
  };

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Alert showIcon type="info" message="Rasmlar avtomatik siqiladi" description="Rasm tanlangan zahoti brauzer ichida siqiladi, keyin storage ga yuklanadi." />
      <Row gutter={[16, 16]}>
        {orderedFields.map((field) => {
          const preview = previews[field.key];
          const existing = existingDocuments[field.docType];
          const isProcessing = compressingKey === field.key;
          return (
            <Col xs={24} md={12} lg={8} key={field.key}>
              <Card size="small" title={<Space><span>{field.label}</span>{field.required ? <Text type="danger">*</Text> : null}</Space>} bordered style={{ borderRadius: 16, height: "100%" }}>
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  <Text type="secondary">Maksimal siqish: {field.maxWidth}px · sifat {field.quality}</Text>
                  {preview?.url ? <img src={preview.url} alt={field.label} style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 12, border: "1px solid #f0f0f0" }} /> : existing?.file_url ? <img src={existing.file_url} alt={field.label} style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 12, border: "1px solid #f0f0f0" }} /> : <div style={{ height: 180, borderRadius: 12, border: "1px dashed #d9d9d9", display: "flex", alignItems: "center", justifyContent: "center", background: "#fafafa" }}><Space direction="vertical" align="center">{isProcessing ? <LoadingOutlined style={{ fontSize: 28 }} /> : <InboxOutlined style={{ fontSize: 28 }} />}<Text type="secondary">{isProcessing ? "Rasm siqilmoqda..." : "Rasm tanlanmagan"}</Text></Space></div>}
                  <Upload accept={field.accept} beforeUpload={(file) => handleFileChange(file, field.key)} showUploadList={false} disabled={submitting}><Button block icon={<UploadOutlined />} loading={isProcessing}>{preview?.url || existing?.file_url ? "Rasmni almashtirish" : "Rasm tanlash"}</Button></Upload>
                  {files[field.key] ? <Alert type="success" showIcon icon={<CheckCircleOutlined />} message={`${files[field.key].name} (${getReadableFileSize(files[field.key].size)})`} /> : existing?.file_url ? <Alert type="success" showIcon icon={<CheckCircleOutlined />} message="Oldin yuklangan rasm mavjud" /> : null}
                </Space>
              </Card>
            </Col>
          );
        })}
      </Row>
    </Space>
  );
}
