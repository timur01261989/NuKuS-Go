import React, { useMemo, useState } from "react";
import { Button, Input, InputNumber, Modal, Space, Typography, Upload, message } from "antd";
import { CameraOutlined, InboxOutlined } from "@ant-design/icons";
import { useTrip } from "../../context/TripContext";
import { interProvincialApi } from "../../services/interProvincialApi";
import { fmtMoney } from "../../utils/geo";

const { Text } = Typography;

export default function ParcelLogModal({ open, onClose }) {
  const { state, dispatch } = useTrip();
  const [title, setTitle] = useState("");
  const [fee, setFee] = useState(50000);
  const [receiverPhone, setReceiverPhone] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const canSave = useMemo(() => title.trim() && Number(fee || 0) >= 0 && receiverPhone.trim(), [title, fee, receiverPhone]);

  const save = async () => {
    if (!canSave) return message.error("Nom, narx va qabul qiluvchi tel kerak");
    setUploading(true);
    try {
      const imgUrl = await interProvincialApi.uploadParcelPhoto(file, state.tripId);
      const parcel = {
        id: `parcel_${Date.now()}`,
        title: title.trim(),
        fee: Number(fee || 0),
        receiverPhone: receiverPhone.trim(),
        imageUrl: imgUrl,
      };
      dispatch({ type: "ADD_PARCEL", parcel });

      // SMS payload (backend bo'lsa yuboradi)
      const smsText = `Sizga pochta kelyapti. Mashina: ${state.carPlate}. Posilka: ${parcel.title}. Narx: ${fmtMoney(parcel.fee)}.${imgUrl ? ` Rasm: ${imgUrl}` : ""}`;
      await interProvincialApi.sendParcelSms({ phone: parcel.receiverPhone, text: smsText, imageUrl: imgUrl, carPlate: state.carPlate });

      message.success("Posilka qo‘shildi");
      setTitle("");
      setFee(50000);
      setReceiverPhone("");
      setFile(null);
      onClose?.();
    } catch (e) {
      console.error(e);
      message.error("Posilka saqlashda xatolik");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal open={open} onCancel={onClose} footer={null} centered title="📦 Pochta (rasm bilan)">
      <Space direction="vertical" size={10} style={{ width: "100%" }}>
        <Input prefix={<InboxOutlined />} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Masalan: Televizor, Hujjat..." />
        <InputNumber
          value={fee}
          onChange={setFee}
          min={0}
          step={5000}
          style={{ width: "100%" }}
          formatter={(v) => fmtMoney(v).replace(" so'm", "")}
          parser={(v) => Number(String(v || "0").replace(/[^0-9]/g, ""))}
        />
        <Input value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} placeholder="Qabul qiluvchi tel (+998...)" />

        <Upload
          beforeUpload={(f) => {
            setFile(f);
            return false;
          }}
          maxCount={1}
          accept="image/*"
          showUploadList={file ? [{ name: file.name }] : false}
        >
          <Button icon={<CameraOutlined />}>Posilka rasmini qo‘shish (kamera)</Button>
        </Upload>

        <Text type="secondary" style={{ fontSize: 12 }}>
          * Android/iOS’da kamera ochilishi uchun input `capture` kerak bo‘lishi mumkin. Bu yerda Upload foydalanildi.
        </Text>

        <Space style={{ width: "100%", justifyContent: "flex-end" }}>
          <Button onClick={onClose}>Bekor</Button>
          <Button type="primary" onClick={save} loading={uploading}>
            Saqlash
          </Button>
        </Space>
      </Space>
    </Modal>
  );
}
