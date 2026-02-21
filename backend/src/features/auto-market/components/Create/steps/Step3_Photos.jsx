import React, { useRef } from "react";
import { Card, Button, Image, message } from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import { useCreateAd } from "../../../context/CreateAdContext";
import useUploadImages from "../../../hooks/useUploadImages";
import { useAiPipeline } from "../../../hooks/ai/useAiPipeline";
import AiPipelineStatus from "../../modules/CreateAd/AiPipelineStatus";

export default function Step3_Photos() {
  const { ad, patch } = useCreateAd();
  const { upload, uploading } = useUploadImages();
  const { startPipeline } = useAiPipeline();
  const inputRef = useRef(null);

  const onPick = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      // Optimistic UI: start AI pipeline immediately (runs in background)
      startPipeline({ images: files, meta: { source: "createAdPhotos" } }).catch(() => {});

      const uploaded = await upload(files);
      const urls = uploaded.map(x => x.url);
      patch({ images: [...(ad.images || []), ...urls].slice(0, 10) });
    } catch (err) {
      message.error("Rasm yuklashda xatolik");
    } finally {
      e.target.value = "";
    }
  };

  const remove = (idx) => {
    patch({ images: (ad.images || []).filter((_, i) => i !== idx) });
  };

  return (
    <Card style={{ borderRadius: 18, border: "1px solid #e2e8f0" }} bodyStyle={{ padding: 14 }}>
      <div style={{ fontWeight: 900, color: "#0f172a" }}>Rasmlar</div>
      <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
        Kamida 1 ta, maksimal 10 ta rasm.
      </div>

      <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={onPick} />

      <Button
        icon={<UploadOutlined />}
        type="primary"
        loading={uploading}
        onClick={() => inputRef.current?.click()}
        style={{ marginTop: 12, borderRadius: 14, background: "#0ea5e9", border: "none" }}
      >
        Rasm tanlash
      </Button>

      <AiPipelineStatus />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 14 }}>
        {(ad.images || []).map((src, idx) => (
          <div key={idx} style={{ position: "relative", borderRadius: 14, overflow: "hidden", border: "1px solid #e2e8f0" }}>
            <Image src={src} alt="" preview={false} style={{ width: "100%", height: 120, objectFit: "cover" }} />
            <Button
              icon={<DeleteOutlined />}
              shape="circle"
              size="small"
              onClick={() => remove(idx)}
              style={{ position: "absolute", right: 8, top: 8, border: "none", background: "rgba(255,255,255,.92)" }}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}
