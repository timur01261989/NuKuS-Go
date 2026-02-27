import React, { useState } from "react";
import { Modal, Input, Button, Space, Typography, message } from "antd";
import { SafetyOutlined } from "@ant-design/icons";
import { completeParcel } from "../services/integrationApi";

export default function DropoffCodeInput({ open, parcel, onClose, onCompleted }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const c = String(code || "").trim();
    if (c.length < 4) { message.error("4 xonali kod kiriting"); return; }
    try {
      setLoading(true);
      await completeParcel({ parcelId: parcel?.id, secureCode: c });
      message.success("✅ Yuk topshirildi");
      onCompleted?.();
      onClose?.();
      setCode("");
    } catch (e) {
      message.error("Kod xato yoki server xatolik: " + (e?.message || "unknown"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onCancel={onClose} footer={null} centered title={<Space><SafetyOutlined /><span>Maxfiy kod</span></Space>}>
      <Typography.Paragraph style={{ marginBottom: 10 }}>Qabul qiluvchidan 4 xonali kodni so'rang.</Typography.Paragraph>
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="Masalan: 8855"
        inputMode="numeric"
        size="large"
        style={{ borderRadius: 12 }}
      />
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
        <Space>
          <Button onClick={onClose}>Bekor</Button>
          <Button type="primary" loading={loading} onClick={submit} style={{ borderRadius: 12 }}>Tasdiqlash</Button>
        </Space>
      </div>
    </Modal>
  );
}
