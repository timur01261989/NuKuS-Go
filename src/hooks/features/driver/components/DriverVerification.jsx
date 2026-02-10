import React, { useState } from 'react';
import { Card, Button, Typography, Upload, message, Steps, Space } from 'antd';
import { CameraOutlined, IdcardOutlined, FileTextOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { supabase } from '../../pages/supabase';
// Faylning yuqori qismida import qiling
import { compressImage } from '../../utils/imageUtils'; 

// ... komponent ichida
const handleUpload = async (file, type) => {
  setLoading(true);
  try {
    // 1. Rasmni yuklashdan oldin kichraytiramiz
    const optimizedFile = await compressImage(file);

    const fileExt = optimizedFile.name ? optimizedFile.name.split('.').pop() : 'jpg';
    const fileName = `${userId}/${type}_${Date.now()}.${fileExt}`;

    // 2. Optimizatsiya bo'lgan faylni Supabase-ga yuboramiz
    const { error: uploadError } = await supabase.storage
      .from('driver-docs')
      .upload(fileName, optimizedFile);

    if (uploadError) throw uploadError;

    // ... qolgan bazani yangilash kodlari
    message.success("Hujjat yuklandi va optimizatsiya qilindi!");
  } catch (err) {
    message.error("Xatolik: " + err.message);
  } finally {
    setLoading(false);
  }
};

const { Title, Text } = Typography;

export default function DriverVerification({ userId, onFinish }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Rasmni yuklash va optimizatsiya qilish (Image Edit mantiqi)
  const handleUpload = async (file, type) => {
    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${type}_${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Supabase Storage-ga yuklash
      const { error: uploadError } = await supabase.storage
        .from('driver-docs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Drivers jadvalida xujjat linkini yangilash
      const { data: urlData } = supabase.storage.from('driver-docs').getPublicUrl(filePath);
      const updateData = {};
      updateData[`${type}_url`] = urlData.publicUrl;

      await supabase.from('drivers').update(updateData).eq('id', userId);

      message.success("Hujjat yuklandi!");
      setStep(prev => prev + 1);
    } catch (err) {
      message.error("Yuklashda xatolik: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', background: '#fff', minHeight: '100vh', textAlign: 'center' }}>
      <Title level={3} style={{ fontFamily: 'YangoHeadline' }}>Tekshiruvdan o'tish</Title>
      <Text type="secondary">Buyurtma olish uchun hujjatlaringizni tasdiqlang</Text>

      <Steps 
        current={step} 
        style={{ margin: '30px 0' }}
        items={[
          { title: 'Guvohnoma', icon: <IdcardOutlined /> },
          { title: 'Tex-pasport', icon: <FileTextOutlined /> },
          { title: 'Yakunlash', icon: <CheckCircleOutlined /> }
        ]}
      />

      {step === 0 && (
        <Card style={{ borderRadius: 20, border: '2px dashed #ddd' }}>
          <IdcardOutlined style={{ fontSize: 50, color: '#FFD700', marginBottom: 20 }} />
          <Title level={4}>Haydovchilik guvohnomasi</Title>
          <Text type="secondary">Guvohnomaning old tomonini rasmga olib yuklang</Text>
          <Upload 
            showUploadList={false} 
            beforeUpload={(file) => { handleUpload(file, 'license'); return false; }}
          >
            <Button block size="large" icon={<CameraOutlined />} style={{ marginTop: 25, height: 55, borderRadius: 15, background: '#FFD700', border: 'none' }}>
              RASMGA OLISH
            </Button>
          </Upload>
        </Card>
      )}

      {step === 1 && (
        <Card style={{ borderRadius: 20, border: '2px dashed #ddd' }}>
          <FileTextOutlined style={{ fontSize: 50, color: '#1890ff', marginBottom: 20 }} />
          <Title level={4}>Avtomobil Tex-pasporti</Title>
          <Text type="secondary">Texpasportning ikkala tomoni ko'ringan rasmini yuklang</Text>
          <Upload 
            showUploadList={false} 
            beforeUpload={(file) => { handleUpload(file, 'tech_passport'); return false; }}
          >
            <Button block size="large" icon={<CameraOutlined />} style={{ marginTop: 25, height: 55, borderRadius: 15, background: '#1890ff', color: '#fff', border: 'none' }}>
              RASMGA OLISH
            </Button>
          </Upload>
        </Card>
      )}

      {step === 2 && (
        <div style={{ marginTop: 50 }}>
          <CheckCircleOutlined style={{ fontSize: 80, color: '#52c41a' }} />
          <Title level={3} style={{ marginTop: 20 }}>Rahmat!</Title>
          <Text type="secondary" style={{ fontSize: 16 }}>Hujjatlaringiz ko'rib chiqish uchun yuborildi. Odatda bu 2-3 soat vaqt oladi.</Text>
          <Button block size="large" onClick={onFinish} style={{ marginTop: 40, height: 60, borderRadius: 20, background: '#000', color: '#fff' }}>
            ASOSIY SAHIFAGA QAYTISH
          </Button>
        </div>
      )}
    </div>
  );
}