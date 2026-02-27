import React, { useMemo } from "react";
import { Button, Upload } from "antd";
import { CameraOutlined } from "@ant-design/icons";
import { useFreight } from "../../context/FreightContext";

export default function CargoPhotoUpload() {
  const { photoUrl, setPhotoUrl, setPhotoFile } = useFreight();

  const uploadProps = useMemo(() => ({
    accept: "image/*",
    showUploadList: false,
    beforeUpload: (file) => {
      setPhotoFile(file);
      const url = URL.createObjectURL(file);
      setPhotoUrl(url);
      return false;
    },
  }), [setPhotoFile, setPhotoUrl]);

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <Upload {...uploadProps}>
        <Button icon={<CameraOutlined />} style={{ borderRadius: 14 }}>Yukni rasmga oling</Button>
      </Upload>
      {photoUrl ? (
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <img src={photoUrl} alt="cargo" style={{ width: 56, height: 56, borderRadius: 14, objectFit: "cover" }} />
          <Button danger onClick={() => { try { URL.revokeObjectURL(photoUrl); } catch {} setPhotoFile(null); setPhotoUrl(""); }} style={{ borderRadius: 14 }}>
            O‘chirish
          </Button>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: "#888" }}>Rasm haydovchiga “sig‘adi/sig‘maydi”ni tez baholashga yordam beradi.</div>
      )}
    </div>
  );
}
