import React, { useState } from "react";
import { 
  Form, Input, Button, Select, Upload, message, Typography, Steps, Row, Col 
} from "antd";
import { 
  CarOutlined, NumberOutlined, UserOutlined, 
  UploadOutlined, CheckCircleOutlined, CameraOutlined, IdcardOutlined, FileTextOutlined 
} from "@ant-design/icons";
import { supabase } from "../../pages/supabase"; 

const { Title, Text } = Typography;
const { Option } = Select;

export default function DriverRegister({ onRegisterSuccess }) {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();

  // Fayllar uchun alohida statelar
  const [driverPhoto, setDriverPhoto] = useState(null);
  const [carPhoto, setCarPhoto] = useState(null);
  const [pravaPhoto, setPravaPhoto] = useState(null);
  const [texPassportPhoto, setTexPassportPhoto] = useState(null);

  const handleRegister = async (values) => {
    setLoading(true);
    try {
      // 1. Userni aniqlash
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
         message.error("Tizimga kirilmagan!");
         return;
      }

      // 2. Fayllarni yuklash (Simulyatsiya)
      // Agar haqiqiy Storage bo'lsa, shu yerda yuklab URL olinadi.
      // Hozircha shunchaki "yuklandi" deb belgilaymiz.
      const avatarUrl = driverPhoto ? "avatar_yuklandi.jpg" : null;
      const carUrl = carPhoto ? "mashina_yuklandi.jpg" : null;
      const pravaUrl = pravaPhoto ? "prava_yuklandi.jpg" : null;
      const texUrl = texPassportPhoto ? "texpasport_yuklandi.jpg" : null;

      // 3. Bazaga yozish (Yangi ustunlar bo'yicha)
      const { error } = await supabase
        .from('drivers')
        .insert([
          {
            id: user.id,
            first_name: values.first_name,   // Ismi
            last_name: values.last_name,     // Familiyasi
            middle_name: values.middle_name, // Otasining ismi
            phone: values.phone,

            car_model: values.car_model,
            car_color: values.car_color,
            plate_number: values.plate_number,
            car_year: values.car_year,

            avatar_url: avatarUrl,
            car_photo_url: carUrl,       // Mashina rasmi (agar bazada ustun bo'lsa)
            prava_url: pravaUrl,         // ALOHIDA: Prava
            tex_passport_url: texUrl,    // ALOHIDA: Texpasport

            status: 'pending', 
          }
        ]);

      if (error) throw error;

      message.success("Arizangiz qabul qilindi!");
      if (onRegisterSuccess) onRegisterSuccess();

    } catch (err) {
      console.error(err);
      message.error("Xatolik: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fayl yuklashni boshqarish
  const uploadProps = (setFile) => ({
    beforeUpload: (file) => {
      setFile(file);
      return false; // Avtomatik yuklanmasin
    },
    onRemove: () => setFile(null),
    maxCount: 1,
    listType: "picture-card",
    showUploadList: { showPreviewIcon: false }
  });

  // Kichik yordamchi upload tugmasi
  const UploadButton = ({ text, icon }) => (
     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
        <div style={{ marginTop: 8, fontSize: 12 }}>{text}</div>
     </div>
  );

  return (
    <div style={{ padding: "0 20px 40px" }}>

      <div style={{ textAlign: "center", marginBottom: 30 }}>
         <div style={{ background: '#fef3c7', width: 70, height: 70, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
            <CarOutlined style={{ fontSize: 35, color: '#d97706' }} />
         </div>
         <Title level={3} style={{ margin: 0 }}>Haydovchi bo'ling</Title>
         <Text type="secondary">Ma'lumotlarni to'ldiring va daromad qilishni boshlang</Text>
      </div>

      <Steps 
        current={currentStep} 
        size="small" 
        style={{ marginBottom: 30 }}
        items={[
            { title: 'Shaxsiy' },
            { title: 'Mashina' },
            { title: 'Hujjatlar' },
        ]}
      />

      <Form 
        form={form} 
        layout="vertical" 
        onFinish={handleRegister}
        initialValues={{ car_year: '2023' }}
      >

        {/* 1-QADAM: SHAXSIY MA'LUMOTLAR (F.I.SH ALOHIDA) */}
        <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>

            <Form.Item name="first_name" label="Ismingiz" rules={[{ required: true, message: "Ismingizni kiriting" }]}>
              <Input prefix={<UserOutlined />} size="large" placeholder="Masalan: Timur" />
            </Form.Item>

            <Form.Item name="last_name" label="Familiyangiz" rules={[{ required: true, message: "Familiyangizni kiriting" }]}>
              <Input prefix={<UserOutlined />} size="large" placeholder="Masalan: Xalmuratov" />
            </Form.Item>

            <Form.Item name="middle_name" label="Otasining ismi">
              <Input prefix={<UserOutlined />} size="large" placeholder="Masalan: Azatovich" />
            </Form.Item>

            <Form.Item name="phone" label="Telefon raqam" rules={[{ required: true, message: "Telefon raqam" }]}>
              <Input prefix={<span>+998</span>} size="large" placeholder="90 123 45 67" type="number" />
            </Form.Item>

            <Form.Item label="Shaxsiy rasmingiz (Selfi)" required>
                <div style={{ textAlign: 'center', border: '1px dashed #d9d9d9', padding: 10, borderRadius: 10, background: '#fafafa' }}>
                    <Upload {...uploadProps(setDriverPhoto)}>
                        {!driverPhoto && <UploadButton text="Rasm yuklash" icon={<CameraOutlined />} />}
                    </Upload>
                    <Text type="secondary" style={{ fontSize: 11 }}>Yuzingiz aniq ko'ringan bo'lishi shart</Text>
                </div>
            </Form.Item>

            <Button type="primary" block size="large" onClick={() => setCurrentStep(1)} style={{ background: '#000', marginTop: 10 }}>
                Keyingi qadam
            </Button>
        </div>

        {/* 2-QADAM: MASHINA MA'LUMOTLARI */}
        <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
            <Form.Item name="car_model" label="Mashina modeli" rules={[{ required: true }]}>
              <Select size="large" placeholder="Tanlang">
                 <Option value="Gentra">Chevrolet Gentra</Option>
                 <Option value="Cobalt">Chevrolet Cobalt</Option>
                 <Option value="Nexia3">Nexia 3</Option>
                 <Option value="Spark">Spark</Option>
                 <Option value="Onix">Onix</Option>
                 <Option value="Monza">Monza</Option>
                 <Option value="Damas">Damas</Option>
                 <Option value="Boshqa">Boshqa</Option>
              </Select>
            </Form.Item>

            <Form.Item name="plate_number" label="Davlat raqami" rules={[{ required: true }]}>
              <Input prefix={<NumberOutlined />} size="large" placeholder="95 A 777 AA" style={{ textTransform: 'uppercase' }} />
            </Form.Item>

            <Row gutter={10}>
                <Col span={12}>
                    <Form.Item name="car_color" label="Rangi" rules={[{ required: true }]}>
                       <Input placeholder="Oq" size="large" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="car_year" label="Yili" rules={[{ required: true }]}>
                       <Input type="number" size="large" />
                    </Form.Item>
                </Col>
            </Row>

            <div style={{ display: 'flex', gap: 10 }}>
                <Button block size="large" onClick={() => setCurrentStep(0)}>Ortga</Button>
                <Button type="primary" block size="large" onClick={() => setCurrentStep(2)} style={{ background: '#000' }}>Keyingi</Button>
            </div>
        </div>

        {/* 3-QADAM: HUJJATLAR (ALOHIDA YUKLASH) */}
        <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>

            <Title level={5}>Hujjatlarni yuklash</Title>

            <Form.Item label="Mashina rasmi (Oldidan)" required>
                <Upload {...uploadProps(setCarPhoto)} style={{ width: '100%' }}>
                    {!carPhoto && <UploadButton text="Mashina rasmi" icon={<CarOutlined />} />}
                </Upload>
            </Form.Item>

            <Form.Item label="Texnik pasport (Oldi va orqasi)" required>
                <Upload {...uploadProps(setTexPassportPhoto)}>
                    {!texPassportPhoto && <UploadButton text="Texpasport" icon={<FileTextOutlined />} />}
                </Upload>
            </Form.Item>

            <Form.Item label="Haydovchilik guvohnomasi (Prava)" required>
                <Upload {...uploadProps(setPravaPhoto)}>
                    {!pravaPhoto && <UploadButton text="Prava" icon={<IdcardOutlined />} />}
                </Upload>
            </Form.Item>

            <div style={{ marginTop: 30, display: 'flex', gap: 10 }}>
                <Button block size="large" onClick={() => setCurrentStep(1)}>Ortga</Button>
                <Button 
                    type="primary" block size="large" 
                    htmlType="submit" 
                    loading={loading}
                    icon={<CheckCircleOutlined />}
                    style={{ background: '#52c41a', fontWeight: 'bold' }}
                >
                    Arizani Yuborish
                </Button>
            </div>
        </div>

      </Form>
    </div>
  );
}