import React, { useRef, useState } from "react";
import { Card, Button, Image, message, Alert, Space, Tag, Switch } from "antd";
import { UploadOutlined, DeleteOutlined, RobotOutlined, CheckOutlined, CloseOutlined, SafetyOutlined } from "@ant-design/icons";
import { useCreateAd } from "../../../context/CreateAdContext";
import useUploadImages from "../../../hooks/useUploadImages";
import { useAiPipeline } from "../../../hooks/ai/useAiPipeline";
import AiPipelineStatus from "../../modules/CreateAd/AiPipelineStatus";
import PhotoAngleGuide from "../PhotoAngleGuide";
import { useAutoMarketI18n } from "../../../utils/useAutoMarketI18n";

const AI_BASE = (import.meta?.env?.VITE_PYTHON_AI_URL || import.meta?.env?.VITE_API_BASE_URL || import.meta?.env?.VITE_API_BASE || "").replace(/\/$/, "");

async function recognizeCar(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64 = (e.target.result || "").split(",")[1];
        if (!base64) { resolve(null); return; }
        const r = await fetch(`${AI_BASE}/car-recognize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_base64: base64 }),
          signal: AbortSignal.timeout(8000),
        });
        if (!r.ok) { resolve(null); return; }
        const d = await r.json();
        resolve(d);
      } catch {
        resolve(null);
      }
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

export default function Step3_Photos() {
  const { ad, patch } = useCreateAd();
  const { upload, uploading } = useUploadImages();
  const { startPipeline } = useAiPipeline();
  const { am } = useAutoMarketI18n();
  const inputRef = useRef(null);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDismissed, setAiDismissed] = useState(false);
  const [autoBlurPlates, setAutoBlurPlates] = useState(true);

  const onPick = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      startPipeline({ images: files, meta: { source: "createAdPhotos", autoBlur: autoBlurPlates } }).catch(() => {});
      if (files[0] && !aiDismissed) {
        setAiLoading(true);
        setAiResult(null);
        const result = await recognizeCar(files[0]);
        if (result?.brand) setAiResult(result);
        setAiLoading(false);
      }
      const uploaded = await upload(files);
      const urls = uploaded.map((x) => x.url);
      patch({ images: [...(ad.images || []), ...urls].slice(0, 10) });
      if (autoBlurPlates) message.success(am("autoExtra.blurSuccess"));
    } catch {
      message.error(am("autoExtra.uploadError"));
    } finally {
      e.target.value = "";
    }
  };

  const remove = (idx) => patch({ images: (ad.images || []).filter((_, i) => i !== idx) });

  const applyAiResult = () => {
    if (!aiResult) return;
    const update = {};
    if (aiResult.brand) update.brand = aiResult.brand;
    if (aiResult.model) update.model = aiResult.model;
    if (aiResult.color) update.color = aiResult.color;
    if (aiResult.body_type) update.body_type = aiResult.body_type;
    patch(update);
    message.success(am("autoExtra.aiApplied"));
    setAiResult(null);
    setAiDismissed(true);
  };

  return (
    <Card style={{ borderRadius: 18, border: "1px solid #e2e8f0" }} bodyStyle={{ padding: 14 }}>
      <div style={{ fontWeight: 900, color: "#0f172a" }}>{am("autoExtra.photos")}</div>
      <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{am("autoExtra.photosHelp")}</div>

      <div style={{ marginTop: 16, padding: "12px", background: "#f8fafc", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <SafetyOutlined style={{ color: "#10b981", fontSize: "18px" }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: "13px", color: "#0f172a" }}>{am("autoExtra.hidePlateAi")}</div>
            <div style={{ fontSize: "11px", color: "#64748b" }}>{am("autoExtra.hidePlateHint")}</div>
          </div>
        </div>
        <Switch checked={autoBlurPlates} onChange={setAutoBlurPlates} style={{ background: autoBlurPlates ? "#10b981" : undefined }} />
      </div>

      <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={onPick} />

      <Button icon={<UploadOutlined />} type="primary" loading={uploading} onClick={() => inputRef.current?.click()} style={{ marginTop: 16, borderRadius: 14, background: "#0ea5e9", border: "none", width: "100%", height: 42, fontWeight: 600 }}>
        {am("autoExtra.choosePhoto")}
      </Button>

      <div style={{ marginTop: 12 }}><AiPipelineStatus /></div>

      {aiLoading && <Alert style={{ marginTop: 12, borderRadius: 12 }} icon={<RobotOutlined />} type="info" message={am("autoExtra.aiAnalyzing")} showIcon />}

      {aiResult && !aiDismissed && (
        <Alert
          style={{ marginTop: 12, borderRadius: 12 }}
          type="success"
          showIcon
          icon={<RobotOutlined style={{ color: "#52c41a" }} />}
          message={<div><div style={{ fontWeight: 700, marginBottom: 6 }}>🤖 {am("autoExtra.aiDetected")}</div><Space wrap size={[6, 6]}>{aiResult.brand && <Tag color="blue">{aiResult.brand}</Tag>}{aiResult.model && <Tag color="cyan">{aiResult.model}</Tag>}{aiResult.color && <Tag color="orange">{aiResult.color}</Tag>}{aiResult.body_type && <Tag color="purple">{aiResult.body_type}</Tag>}</Space><div style={{ fontSize: 11, color: "#888", marginTop: 6 }}>{aiResult.note || am("autoExtra.aiConfirm")}</div></div>}
          action={<Space direction="vertical" size="small"><Button size="small" type="primary" icon={<CheckOutlined />} onClick={applyAiResult} style={{ background: "#52c41a", border: "none" }}>{am("autoExtra.aiApply")}</Button><Button size="small" icon={<CloseOutlined />} onClick={() => { setAiResult(null); setAiDismissed(true); }}>{am("autoExtra.aiReject")}</Button></Space>}
        />
      )}

      <PhotoAngleGuide images={ad.images || []} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 16 }}>
        {(ad.images || []).map((src, idx) => (
          <div key={idx} style={{ position: "relative", borderRadius: 14, overflow: "hidden", border: "1px solid #e2e8f0" }}>
            <Image src={src} alt="" preview={false} style={{ width: "100%", height: 120, objectFit: "cover" }} />
            <Button icon={<DeleteOutlined />} shape="circle" size="small" onClick={() => remove(idx)} style={{ position: "absolute", top: 8, right: 8 }} />
          </div>
        ))}
      </div>
    </Card>
  );
}
