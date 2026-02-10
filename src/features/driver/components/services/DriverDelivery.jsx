import React, { useState, useEffect } from "react";
import { 
  Card, Button, Typography, Row, Col, InputNumber, 
  Space, message, ConfigProvider, Divider, 
  Select, DatePicker, TimePicker, Radio, Checkbox, Tag 
} from "antd";
import { 
  ArrowLeftOutlined, CalendarOutlined, ClockCircleOutlined,
  CheckCircleOutlined, RocketOutlined, DeleteOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import { translations } from "../../../../pages/translations";
import { supabase } from "../../../../lib/supabase";
 

const { Title, Text } = Typography;
const { Option } = Select;

export default function DriverDelivery({ onBack }) {
  const savedLang = localStorage.getItem("appLang") || "uz_lotin";
  const t = translations[savedLang] || translations["uz_lotin"];

  // 1. E'lon holatini localStorage'dan tekshirish
  const savedAd = JSON.parse(localStorage.getItem("activeDeliveryAd"));
  const [step, setStep] = useState(savedAd ? 2 : 0);
  const [priceType, setPriceType] = useState("deal");

  const [formData, setFormData] = useState(savedAd || {
    fromRegion: "Qoraqalpog'iston Respublikasi",
    fromDistrict: t.nukus,
    toRegion: "Qoraqalpog'iston Respublikasi",
    toDistrict: t.chimboy,
    date: dayjs().format("YYYY-MM-DD"),
    time: "08:00",
    transportType: "yengil",
    price: 0,
    isExpress: false
  });

  const regions = [
    { name: "Qoraqalpog'iston Respublikasi", districts: [t.nukus, t.chimboy, t.qongirot, t.beruniy, t.tortkol, t.moynoq, t.xojayli, t.shumanay, t.qanlikol, t.kegeyli, t.qoraozak, t.taxtakopir, "Ellikqala", "Amudaryo", "Nukus tumani", "Bo'zatov"] },
    { name: "Toshkent shahri", districts: ["Yunusobod", "Chilonzor", "Mirzo Ulug'bek", "Yashnobod", "Yakkasaroy", "Sergeli", "Uchtepa", "Olmazor", "Bektemir", "Mirobod", "Shayxontohur", "Yangihayot"] },
    // ... boshqa viloyatlar
  ];

  const handleRegionChange = (value, type) => {
    const selectedRegion = regions.find(r => r.name === value);
    if (type === "from") {
      setFormData({ ...formData, fromRegion: value, fromDistrict: selectedRegion.districts[0] });
    } else {
      setFormData({ ...formData, toRegion: value, toDistrict: selectedRegion.districts[0] });
    }
  };

  // Buyurtmani saqlash funksiyasi
  const handleSave = () => { 
    localStorage.setItem("activeDeliveryAd", JSON.stringify(formData));
    setStep(2); 
    message.success(t.adActive); 
  };

  // Buyurtmani o'chirish funksiyasi
  const handleCancelAd = () => {
    localStorage.removeItem("activeDeliveryAd");
    setStep(0);
    message.warning(t.cancelAd || "E'lon o'chirildi");
  };

  const renderForm = () => (
    <div style={{ padding: "15px", background: "#f6ffed", minHeight: "100vh", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 25 }}>
        <Button shape="circle" size="large" icon={<ArrowLeftOutlined />} onClick={onBack} style={{ border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
        <Title level={4} style={{ margin: "0 0 0 15px", color: "#389e0d", fontWeight: 800 }}>{t.delivery}</Title>
      </div>

      <Card title={t.selectRoute} bordered={false} style={{ borderRadius: 24, marginBottom: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <div>
             <Text type="secondary" style={{fontSize: 12, fontWeight: 600}}>{t.qayerdan}</Text>
             <Select size="large" style={{ width: "100%", marginTop: 5 }} value={formData.fromRegion} onChange={val => handleRegionChange(val, "from")}>
               {regions.map(r => <Option key={r.name} value={r.name}>{r.name}</Option>)}
             </Select>
             <Select size="large" style={{ width: "100%", marginTop: 10 }} value={formData.fromDistrict} onChange={val => setFormData({...formData, fromDistrict: val})}>
               {regions.find(r => r.name === formData.fromRegion).districts.map(d => <Option key={d} value={d}>{d}</Option>)}
             </Select>
          </div>

          <div style={{ position: 'relative' }}>
             <Divider style={{ margin: "0" }} />
             <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#fff', padding: '0 10px', color: '#ccc' }}>↓</div>
          </div>

          <div>
             <Text type="secondary" style={{fontSize: 12, fontWeight: 600}}>{t.qayerga}</Text>
             <Select size="large" style={{ width: "100%", marginTop: 5 }} value={formData.toRegion} onChange={val => handleRegionChange(val, "to")}>
               {regions.map(r => <Option key={r.name} value={r.name}>{r.name}</Option>)}
             </Select>
             <Select size="large" style={{ width: "100%", marginTop: 10 }} value={formData.toDistrict} onChange={val => setFormData({...formData, toDistrict: val})}>
               {regions.find(r => r.name === formData.toRegion).districts.map(d => <Option key={d} value={d}>{d}</Option>)}
             </Select>
          </div>
        </Space>
      </Card>

      <Card style={{ marginBottom: 20, borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: 'none' }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 15 }}>
          <Space><CalendarOutlined style={{ color: '#52c41a' }} /> <Text strong>{t.departureDate}</Text></Space>
          <DatePicker defaultValue={dayjs(formData.date)} format="YYYY-MM-DD" onChange={(d, s) => setFormData({...formData, date: s})} variant="borderless" style={{ fontWeight: 'bold' }} />
        </Row>
        <Divider style={{ margin: "5px 0" }} />
        <Row justify="space-between" align="middle" style={{ marginTop: 15 }}>
          <Space><ClockCircleOutlined style={{ color: '#52c41a' }} /> <Text strong>{t.departureTime}</Text></Space>
          <TimePicker format="HH:mm" value={dayjs(formData.time, "HH:mm")} onChange={(t_val, s) => setFormData({...formData, time: s})} variant="borderless" style={{ fontWeight: 'bold' }} />
        </Row>
      </Card>

      <Card style={{ marginBottom: 25, borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: 'none' }}>
        <Radio.Group onChange={e => setPriceType(e.target.value)} value={priceType} style={{ width: '100%' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Radio value="deal" style={{ fontSize: 16 }}>Kelishuv asosida</Radio>
            <Radio value="start" style={{ fontSize: 16 }}>Boshlang'ich summa</Radio>
          </Space>
        </Radio.Group>
        {priceType === "start" && (
          <InputNumber 
             size="large"
             style={{ width: "100%", marginTop: 15, borderRadius: 12 }} 
             value={formData.price} 
             onChange={v => setFormData({...formData, price: v})} 
             formatter={value => `${value} ${t.som}`} 
             placeholder="Summani kiriting"
          />
        )}
      </Card>

      <Button 
        block type="primary" size="large" 
        onClick={() => setStep(1)} 
        style={{ 
           height: 60, borderRadius: 18, background: "#52c41a", fontWeight: "800", fontSize: 18,
           boxShadow: '0 8px 20px rgba(82,196,26,0.4)', border: 'none', transition: 'transform 0.1s'
        }}
        onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.97)"}
        onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
        onTouchStart={(e) => e.currentTarget.style.transform = "scale(0.97)"}
        onTouchEnd={(e) => e.currentTarget.style.transform = "scale(1)"}
      >
        {t.create.toUpperCase()}
      </Button>
    </div>
  );

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#52c41a', borderRadius: 12 } }}>
      <div style={{ minHeight: "100vh", background: "#fff" }}>

        {step === 0 && renderForm()}

        {step === 1 && (
          <div style={{ padding: 25, paddingTop: 40 }}>
            <Title level={3} style={{ textAlign: "center", marginBottom: 30, fontWeight: 800 }}>{t.confirmDetails}</Title>

            <Card style={{ borderRadius: 30, boxShadow: '0 10px 30px rgba(0,0,0,0.08)', border: 'none', overflow: 'hidden' }}>
              <div style={{ background: '#f6ffed', margin: '-24px -24px 20px -24px', padding: '20px', textAlign: 'center' }}>
                 <RocketOutlined style={{ fontSize: 40, color: '#52c41a', marginBottom: 10 }} />
                 <Title level={5} style={{ margin: 0, color: '#52c41a' }}>{formData.isExpress ? "EXPRESS DELIVERY" : "STANDARD DELIVERY"}</Title>
              </div>

              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">{t.qayerdan}</Text>
                    <Text strong>{formData.fromDistrict}</Text>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">{t.qayerga}</Text>
                    <Text strong>{formData.toDistrict}</Text>
                 </div>
                 <Divider style={{ margin: "5px 0" }} />
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text type="secondary">{t.price}</Text>
                    <Title level={4} style={{ margin: 0, color: '#52c41a' }}>{priceType === "deal" ? "Kelishuv" : `${formData.price} ${t.som}`}</Title>
                 </div>
              </Space>
            </Card>

            <Space direction="vertical" style={{ width: "100%", marginTop: 40 }} size={15}>
              <Button 
                 block type="primary" size="large" 
                 style={{ height: 60, borderRadius: 18, background: "#000", fontWeight: 700, fontSize: 16 }} 
                 onClick={handleSave}
              >
                 {t.save.toUpperCase()}
              </Button>
              <Button block size="large" type="text" onClick={() => setStep(0)} style={{ height: 50, color: '#888' }}>
                 {t.back.toUpperCase()}
              </Button>
            </Space>
          </div>
        )}

        {/* STEP 2: FAOL HOLAT VA O'CHIRISH TUGMASI */}
        {step === 2 && (
          <div style={{ padding: 25, height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
               <Card style={{ textAlign: "center", borderRadius: 32, boxShadow: "0 15px 40px rgba(82,196,26,0.15)", border: 'none' }}>
                 <div style={{ marginBottom: 20, background: '#f6ffed', width: 100, height: 100, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <CheckCircleOutlined style={{ fontSize: 50, color: "#52c41a" }} />
                 </div>
                 <Title level={3} style={{ fontWeight: 800 }}>{t.adActive}</Title>
                 <Tag color={formData.isExpress ? "gold" : "green"} style={{ padding: '5px 15px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                    {formData.isExpress ? "EXPRESS" : "DELIVERY"}
                 </Tag>

                 <Divider style={{ margin: "25px 0" }} />

                 <Row justify="space-between" align="middle">
                   <Col span={10}><Text type="secondary" style={{fontSize: 10}}>{t.qayerdan}</Text><Title level={5} style={{margin:0}}>{formData.fromDistrict}</Title></Col>
                   <Col span={4}><RocketOutlined style={{ color: '#ccc' }} /></Col>
                   <Col span={10}><Text type="secondary" style={{fontSize: 10}}>{t.qayerga}</Text><Title level={5} style={{margin:0}}>{formData.toDistrict}</Title></Col>
                 </Row>

                 <div style={{ marginTop: 25, background: '#fafafa', padding: 15, borderRadius: 16 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Sizning eltish xizmati e'loningiz faol va mijozlarga ko'rinmoqda.</Text>
                 </div>
               </Card>
            </div>

            <Space direction="vertical" size={12} style={{ width: "100%", paddingBottom: 20 }}>
              <Button 
                 block type="primary" size="large" 
                 style={{ background: "#000", height: 60, borderRadius: 18, fontWeight: 700 }} 
                 onClick={onBack}
              >
                {t.backToMenu}
              </Button>
              {/* O'CHIRISH TUGMASI */}
              <Button 
                 block danger ghost size="large" icon={<DeleteOutlined />} 
                 style={{ height: 60, borderRadius: 18, border: '2px solid #ff4d4f', fontWeight: 600 }} 
                 onClick={handleCancelAd}
              >
                {t.cancelAd.toUpperCase()}
              </Button>
            </Space>
          </div>
        )}
      </div>
    </ConfigProvider>
  );
}