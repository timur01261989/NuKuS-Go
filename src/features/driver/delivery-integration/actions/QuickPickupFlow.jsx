import React, { useMemo, useState } from "react";
import { Modal, Steps, Button, Space, Upload, Input, message } from "antd";
import { CameraOutlined, SendOutlined, CheckOutlined } from "@ant-design/icons";
import { buildParcelSmsText, markParcelPickup } from "../services/integrationApi";

export default function QuickPickupFlow({ open, parcel, vehiclePlate, deepLink, onClose, onDone }) {
  const [step, setStep] = useState(0);
  const [photoFile, setPhotoFile] = useState(null);
  const [receiverPhone, setReceiverPhone] = useState(parcel?.receiver_phone || "");
  const [sending, setSending] = useState(false);

  const canNext = useMemo(() => {
    if (step === 0) return true;
    if (step === 1) return !!photoFile;
    if (step === 2) return !!String(receiverPhone || "").trim();
    return true;
  }, [step, photoFile, receiverPhone]);

  const smsText = useMemo(() => buildParcelSmsText({
    fromCity: parcel?.pickup_location?.city,
    toCity: parcel?.drop_location?.city,
    vehiclePlate,
    photoLink: "(rasm linki backenddan keladi)",
    deepLink,
  }), [parcel, vehiclePlate, deepLink]);

  const handleUpload = ({ file }) => {
    setPhotoFile(file);
    message.success("Rasm tanlandi");
  };

  const next = () => { if (canNext && step < 3) setStep(s => s + 1); };
  const back = () => setStep(s => Math.max(0, s - 1));

  const finish = async () => {
    try {
      setSending(true);
      const photoUrl = photoFile ? `https://example.com/uploads/${encodeURIComponent(photoFile.name)}` : null;
      if (parcel?.id) await markParcelPickup({ parcelId: parcel.id, photoUrl, note: "Picked up (quick flow)" });
      message.success("✅ Pickup belgilandi. SMS payload console.log qilindi.");
      console.log("SMS PAYLOAD:", { to: receiverPhone, text: smsText });
      onDone?.({ photoUrl, receiverPhone });
      onClose?.();
      setStep(0);
      setPhotoFile(null);
    } catch (e) {
      message.error("Pickup flow xatolik: " + (e?.message || "unknown"));
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal open={open} onCancel={onClose} footer={null} centered title="⚡️ Tez olish (Quick Pickup)">
      <Steps
        current={step}
        size="small"
        items={[{ title: "Keldim" }, { title: "Rasm" }, { title: "Telefon" }, { title: "Yakun" }]}
      />
      <div style={{ marginTop: 16 }}>
        {step === 0 && <div style={{ fontSize: 13, color: "#555" }}>Mijozdan posilkani oldingizmi? Keyingisiga o'ting.</div>}
        {step === 1 && (
          <div>
            <Upload accept="image/*" beforeUpload={() => false} showUploadList={false} customRequest={handleUpload}>
              <Button icon={<CameraOutlined />} style={{ borderRadius: 12 }}>Rasmga olish / Tanlash</Button>
            </Upload>
            <div style={{ marginTop: 10, fontSize: 12, color: "#777" }}>Tanlangan: <b>{photoFile?.name || "yo'q"}</b></div>
          </div>
        )}
        {step === 2 && (
          <div>
            <Input value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} placeholder="Qabul qiluvchi tel: +998..." prefix={<SendOutlined />} />
            <div style={{ marginTop: 10, fontSize: 12, color: "#777" }}>
              SMS matni (demo):
              <pre style={{ whiteSpace: "pre-wrap", background: "#f7f7f7", padding: 10, borderRadius: 12 }}>{smsText}</pre>
            </div>
          </div>
        )}
        {step === 3 && <div style={{ fontSize: 13, color: "#555" }}>Tayyor. "Yakunlash" bosilganda pickup saqlanadi.</div>}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
        <Button onClick={back} disabled={step === 0 || sending}>Orqaga</Button>
        <Space>
          {step < 3 ? (
            <Button type="primary" onClick={next} disabled={!canNext} style={{ borderRadius: 12 }}>Keyingi</Button>
          ) : (
            <Button type="primary" icon={<CheckOutlined />} loading={sending} onClick={finish} style={{ borderRadius: 12 }}>Yakunlash</Button>
          )}
        </Space>
      </div>
    </Modal>
  );
}
