import React, { useState } from "react";
import { Card, Button, Typography, Upload, message, Steps } from "antd";
import {
  CameraOutlined,
  IdcardOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

import { supabase } from "../../../lib/supabase";
import { compressImage } from "../../../utils/imageUtils";

const { Title, Text } = Typography;

export default function DriverVerification({ userId, onFinish }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const uploadDoc = async (file, type) => {
    if (!userId) {
      message.error("Foydalanuvchi topilmadi (userId yo‘q). Qayta login qiling.");
      return;
    }

    setLoading(true);
    try {
      // 1) optimize image (safer: if compress fails, fallback to original)
      let optimizedFile = file;
      try {
        optimizedFile = await compressImage(file);
      } catch (_) {
        optimizedFile = file;
      }

      const fileExt =
        (optimizedFile?.name && optimizedFile.name.split(".").pop()) || "jpg";
      const filePath = `${userId}/${type}_${Date.now()}.${fileExt}`;

      // 2) upload to storage (allow replace)
      const { error: uploadError } = await supabase.storage
        .from("driver-docs")
        .upload(filePath, optimizedFile, {
          upsert: true,
          contentType: optimizedFile?.type || "image/jpeg",
        });

      if (uploadError) throw uploadError;

      // 3) get public url
      const { data: urlData } = supabase.storage
        .from("driver-docs")
        .getPublicUrl(filePath);

      const publicUrl = urlData?.publicUrl;
      if (!publicUrl) throw new Error("Public URL olinmadi");

      // 4) update drivers table (IMPORTANT: user_id key)
      const updateData = { [`${type}_url`]: publicUrl };

      const { error: updateError } = await supabase
        .from("drivers")
        .update(updateData)
        .eq("user_id", userId);

      if (updateError) throw updateError;

      message.success("Hujjat yuklandi!");
      setStep((prev) => Math.min(prev + 1, 2));
    } catch (err) {
      message.error("Yuklashda xatolik: " + (err?.message || "noma'lum xato"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: 20,
        background: "#fff",
        minHeight: "100vh",
        textAlign: "center",
      }}
    >
      <Title level={3} style={{ fontFamily: "YangoHeadline" }}>
        Tekshiruvdan o‘tish
      </Title>
      <Text type="secondary">
        Buyurtma olish uchun hujjatlaringizni tasdiqlang
      </Text>

      <Steps
        current={step}
        style={{ margin: "30px 0" }}
        items={[
          { title: "Guvohnoma", icon: <IdcardOutlined /> },
          { title: "Tex-pasport", icon: <FileTextOutlined /> },
          { title: "Yakunlash", icon: <CheckCircleOutlined /> },
        ]}
      />

      {step === 0 && (
        <Card style={{ borderRadius: 20, border: "2px dashed #ddd" }}>
          <IdcardOutlined
            style={{ fontSize: 50, color: "#FFD700", marginBottom: 20 }}
          />
          <Title level={4}>Haydovchilik guvohnomasi</Title>
          <Text type="secondary">
            Guvohnomaning old tomonini rasmga olib yuklang
          </Text>

          <Upload
            showUploadList={false}
            accept="image/*"
            beforeUpload={(file) => {
              uploadDoc(file, "license");
              return false;
            }}
          >
            <Button
              loading={loading}
              disabled={loading}
              block
              size="large"
              icon={<CameraOutlined />}
              style={{
                marginTop: 25,
                height: 55,
                borderRadius: 15,
                background: "#FFD700",
                border: "none",
              }}
            >
              RASMGA OLISH
            </Button>
          </Upload>
        </Card>
      )}

      {step === 1 && (
        <Card style={{ borderRadius: 20, border: "2px dashed #ddd" }}>
          <FileTextOutlined
            style={{ fontSize: 50, color: "#1890ff", marginBottom: 20 }}
          />
          <Title level={4}>Avtomobil Tex-pasporti</Title>
          <Text type="secondary">
            Texpasportning ikkala tomoni ko‘ringan rasmini yuklang
          </Text>

          <Upload
            showUploadList={false}
            accept="image/*"
            beforeUpload={(file) => {
              uploadDoc(file, "tech_passport");
              return false;
            }}
          >
            <Button
              loading={loading}
              disabled={loading}
              block
              size="large"
              icon={<CameraOutlined />}
              style={{
                marginTop: 25,
                height: 55,
                borderRadius: 15,
                background: "#1890ff",
                color: "#fff",
                border: "none",
              }}
            >
              RASMGA OLISH
            </Button>
          </Upload>
        </Card>
      )}

      {step === 2 && (
        <div style={{ marginTop: 50 }}>
          <CheckCircleOutlined style={{ fontSize: 80, color: "#52c41a" }} />
          <Title level={3} style={{ marginTop: 20 }}>
            Rahmat!
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Hujjatlaringiz ko‘rib chiqish uchun yuborildi. Odatda bu 2–3 soat
            vaqt oladi.
          </Text>

          <Button
            block
            size="large"
            onClick={onFinish}
            style={{
              marginTop: 40,
              height: 60,
              borderRadius: 20,
              background: "#000",
              color: "#fff",
            }}
          >
            ASOSIY SAHIFAGA QAYTISH
          </Button>
        </div>
      )}
    </div>
  );
}
