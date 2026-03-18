import React, { useMemo } from "react";
import { useClientText } from "../../shared/i18n_clientLocalize";
import { Button, Card, Upload, Typography } from "antd";
import { orderAssets } from "@/assets/order";
const { Text } = Typography;

export default function PhotoUploader({ photos = [], onChange }) {
  const { cp } = useClientText();
  const uploadProps = useMemo(() => ({
    accept: "image/*",
    multiple: true,
    showUploadList: false,
    beforeUpload: (file) => {
      const url = URL.createObjectURL(file);
      onChange?.([...(photos || []), { file, url }]);
      return false;
    },
  }), [photos, onChange]);

  return (
    <Card style={{ borderRadius: 18 }} bodyStyle={{ padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={orderAssets.chatAttachmentCamera || orderAssets.chatCamera} alt="" style={{ width: 22, height: 22, objectFit: "contain" }} />
          <div style={{ fontWeight: 1000 }}>{cp("Yuk rasmi (ixtiyoriy)")}</div>
        </div>
        <Upload {...uploadProps}>
          <Button
            icon={<img src={orderAssets.chatCamera} alt="" style={{ width: 16, height: 16, objectFit: "contain" }} />}
            style={{ borderRadius: 14, display: "inline-flex", alignItems: "center" }}
          >
            {cp("Rasm qo‘shish")}
          </Button>
        </Upload>
      </div>
      <Text type="secondary" style={{ fontSize: 12 }}>
        {cp("Xavfsizlik uchun: “mana shuni yuboryapman” deb rasm qo‘shsangiz, kuryer adashmaydi.")}
      </Text>
      {photos?.length > 0 ? (
        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          {photos.map((p, idx) => (
            <div key={idx} style={{ position: "relative" }}>
              <img src={p.url} alt="parcel" style={{ width: 72, height: 72, borderRadius: 14, objectFit: "cover" }} />
              <button
                type="button"
                onClick={() => {
                  try { URL.revokeObjectURL(p.url); } catch {}
                  const next = photos.slice(0, idx).concat(photos.slice(idx + 1));
                  onChange?.(next);
                }}
                style={{ position: "absolute", right: -6, top: -6, width: 24, height: 24, borderRadius: 12, border: "none", background: "rgba(0,0,0,.75)", color: "#fff", cursor: "pointer" }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ marginTop: 12, border: "1px dashed rgba(22,119,255,.22)", background: "rgba(22,119,255,.04)", borderRadius: 14, padding: 12, display: "flex", gap: 10, alignItems: "center" }}>
          <img src={orderAssets.chatAttachmentMedia || orderAssets.chatMediaPlay} alt="" style={{ width: 24, height: 24, objectFit: "contain" }} />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {cp("Qutining rasmi, yorliq yoki mahsulot holatini oldindan yuborsangiz, topshirish tezlashadi.")}
          </Text>
        </div>
      )}
    </Card>
  );
}
