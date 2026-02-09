import React, { useState, useEffect } from "react";
import { 
  Card, Button, Typography, Row, Col, InputNumber, 
  Space, message, ConfigProvider, Divider, 
  Select, DatePicker, TimePicker, Radio, Checkbox, Tag 
} from "antd";
import { 
  ArrowLeftOutlined, CalendarOutlined, ClockCircleOutlined,
  CheckCircleOutlined, DeleteOutlined, CarOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import { translations } from "../../../pages/translations";
import { supabase } from "../../../pages/supabase"; 

const { Title, Text } = Typography;
const { Option } = Select;

export default function DriverFreight({ onBack }) {
  const savedLang = localStorage.getItem("appLang") || "uz_lotin";
  const t = translations[savedLang] || translations["uz_lotin"];

  // 1. E'lon holatini localStorage'dan tekshirish
  const savedAd = JSON.parse(localStorage.getItem("activeFreightAd"));
  const [step, setStep] = useState(savedAd ? 2 : 0);
  const [priceType, setPriceType] = useState("deal");

  const regions = [
    { name: "Qoraqalpog'iston Respublikasi", districts: [t.nukus, t.chimboy, t.qongirot, t.beruniy, t.tortkol, t.moynoq, t.xojayli, t.shumanay, t.qanlikol, t.kegeyli, t.qoraozak, t.taxtakopir, "Ellikqala", "Amudaryo", "Bo'zatov"] },
    { name: "Toshkent shahri", districts: ["Yunusobod", "Chilonzor", "Mirzo Ulug'bek", "Yashnobod", "Yakkasaroy", "Sergeli", "Uchtepa", "Olmazor", "Bektemir", "Mirobod", "Shayxontohur", "Yangihayot"] },
    { name: "Toshkent viloyati", districts: ["Nurafshon sh.", "Angren", "Olmaliq", "Chirchiq", "Bekobod", "Yangiyo'l", "Oqqo'rg'on", "Ohangaron", "Bo'stonliq", "Bo'ka", "Zangiota", "Qibray", "Parkent", "Piskent", "Chinoz"] },
    { name: "Andijon", districts: ["Andijon sh.", "Asaka", "Xonobod", "Shahrixon", "Oltinkul", "Baliqchi", "Izboskan", "Jalaquduq", "Marhamat", "Paxtaobod"] },
    { name: "Farg'ona", districts: ["Farg'ona sh.", "Qo'qon", "Marg'ilon", "Quva", "Quvasoy", "Beshariq", "Bog'dod", "Buvayda", "Dang'ara", "Rishton", "O'zbekiston"] },
    { name: "Namangan", districts: ["Namangan sh.", "Chust", "Pop", "Chortoq", "Kosonsoy", "Mingbuloq", "Norin", "Uychi", "Uchqo'rg'on", "Yangiqo'rg'on"] },
    { name: "Buxoro", districts: ["Buxoro sh.", "Kogon", "G'ijduvon", "Jondor", "Qorako'l", "Qorovulbozor", "Olot", "Peshku", "Romitan", "Shofirkon", "Vobkent"] },
    { name: "Samarqand", districts: ["Samarqand sh.", "Kattaqo'rg'on", "Ishtixon", "Jomboy", "Narpay", "Nurobod", "Oqdaryo", "Paxtachi", "Payariq", "Pastdarg'om", "Toyloq", "Bulung'ur", "Urgut"] },
    { name: "Xorazm", districts: ["Urganch sh.", "Xiva", "Bog'ot", "Gurlan", "Qo'shko'pir", "Shovot", "Xonqa", "Yangiariq", "Yangibozor", "Tuproqqala"] },
    { name: "Qashqadaryo", districts: ["Qarshi sh.", "Shaxrisabz", "Muborak", "Dehqonobod", "Kasbi", "Kitob", "Koson", "Mirishkor", "Nishon", "Chiroqchi", "Yakkabog'", "Qamashi"] },
    { name: "Surxondaryo", districts: ["Termiz sh.", "Angor", "Boysun", "Denov", "Jarqo'rg'on", "Muzrabot", "Oltinsoy", "Sariosiyo", "Sherobod", "Sho'rchi", "Uzun", "Qiziriq", "Qumqo'rg'on"] },
    { name: "Navoiy", districts: ["Navoiy sh.", "Zarafshon", "Karmana", "Konimex", "Navbahor", "Nurota", "Tomdi", "Uchquduq", "Xatirchi", "Qiziltepa"] },
    { name: "Jizzax", districts: ["Jizzax sh.", "Arnasoy", "Baxmal", "Do'stlik", "Forish", "G'allaorol", "Sharof Rashidov", "Mirzachul", "Paxtakor", "Yangiobod", "Zomin", "Zafarobod"] },
    { name: "Sirdaryo", districts: ["Guliston sh.", "Shirin", "Yangiyer", "Boyovut", "Mirzaobod", "Oqoltin", "Sayhunobod", "Sardoba", "Xovos"] }
  ];

  const [formData, setFormData] = useState(savedAd || {
    fromRegion: "Qoraqalpog'iston Respublikasi",
    fromDistrict: t.nukus,
    toRegion: "Toshkent shahri",
    toDistrict: "Yunusobod",
    date: dayjs().format("YYYY-MM-DD"),
    time: "10:00",
    carType: "gazel",
    price: 0,
    hasPassenger: false
  });

  const handleRegionChange = (value, type) => {
    const selectedRegion = regions.find(r => r.name === value);
    if (type === "from") {
      setFormData({ ...formData, fromRegion: value, fromDistrict: selectedRegion.districts[0] });
    } else {
      setFormData({ ...formData, toRegion: value, toDistrict: selectedRegion.districts[0] });
    }
  };

  const handleSave = () => { 
    localStorage.setItem("activeFreightAd", JSON.stringify(formData));
    setStep(2); 
    message.success(t.adActive); 
  };

  const handleCancelAd = () => {
    localStorage.removeItem("activeFreightAd");
    setStep(0);
    message.warning(t.cancelAd);
  };

  const renderForm = () => (
    <div style={{ padding: "15px", background: "#fff7e6", minHeight: "100vh", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 25 }}>
        <Button shape="circle" size="large" icon={<ArrowLeftOutlined />} onClick={onBack} style={{ border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
        <Title level={4} style={{ margin: "0 0 0 15px", color: "#fa541c", fontWeight: 800 }}>{t.freight}</Title>
      </div>

      <Card title={t.qayerdan} bordered={false} style={{ borderRadius: 24, marginBottom: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <Select size="large" style={{ width: "100%" }} value={formData.fromRegion} onChange={val => handleRegionChange(val, "from")}>
            {regions.map(r => <Option key={r.name} value={r.name}>{r.name}</Option>)}
          </Select>
          <Select size="large" style={{ width: "100%" }} value={formData.fromDistrict} onChange={val => setFormData({...formData, fromDistrict: val})}>
            {regions.find(r => r.name === formData.fromRegion).districts.map(d => <Option key={d} value={d}>{d}</Option>)}
          </Select>
        </Space>
      </Card>

      <Card title={t.qayerga} bordered={false} style={{ borderRadius: 24, marginBottom: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <Select size="large" style={{ width: "100%" }} value={formData.toRegion} onChange={val => handleRegionChange(val, "to")}>
            {regions.map(r => <Option key={r.name} value={r.name}>{r.name}</Option>)}
          </Select>
          <Select size="large" style={{ width: "100%" }} value={formData.toDistrict} onChange={val => setFormData({...formData, toDistrict: val})}>
            {regions.find(r => r.name === formData.toRegion).districts.map(d => <Option key={d} value={d}>{d}</Option>)}
          </Select>
        </Space>
      </Card>

      <Card style={{ marginBottom: 20, borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: 'none' }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 15 }}>
          <Space><CalendarOutlined style={{ color: '#fa541c' }} /> <Text strong>{t.departureDate}</Text></Space>
          <DatePicker defaultValue={dayjs(formData.date)} format="YYYY-MM-DD" onChange={(d, s) => setFormData({...formData, date: s})} variant="borderless" style={{ fontWeight: 'bold' }} />
        </Row>
        <Divider style={{ margin: "5px 0" }} />
        <Row justify="space-between" align="middle" style={{ marginTop: 15 }}>
          <Space><ClockCircleOutlined style={{ color: '#fa541c' }} /> <Text strong>{t.departureTime}</Text></Space>
          <TimePicker format="HH:mm" value={dayjs(formData.time, "HH:mm")} onChange={(t_val, s) => setFormData({...formData, time: s})} variant="borderless" style={{ fontWeight: 'bold' }} />
        </Row>
      </Card>

      <Card style={{ marginBottom: 25, borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: 'none' }}>
        <Text type="secondary" style={{ fontWeight: 600 }}>{t.carModel}</Text>
        <Select size="large" style={{ width: "100%", marginTop: 10, marginBottom: 20 }} value={formData.carType} onChange={v => setFormData({...formData, carType: v})}>
          <Option value="damas">Damas / Labo</Option>
          <Option value="gazel">Gazel (Bortli/Tent)</Option>
          <Option value="isuzu">Isuzu / Man</Option>
          <Option value="fura">Katta yuk mashina</Option>
        </Select>
        <Checkbox checked={formData.hasPassenger} onChange={e => setFormData({...formData, hasPassenger: e.target.checked})}>
          <Text strong>Hamroh (passajir) bormi?</Text>
        </Checkbox>
      </Card>

      <Card title={t.price} style={{ marginBottom: 30, borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: 'none' }}>
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
           height: 60, borderRadius: 18, background: "#fa541c", fontWeight: "800", fontSize: 18,
           boxShadow: '0 8px 20px rgba(250, 84, 28, 0.4)', border: 'none', transition: 'transform 0.1s'
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
    <ConfigProvider theme={{ token: { colorPrimary: '#fa541c', borderRadius: 12 } }}>
      <div style={{ minHeight: "100vh", background: "#fff" }}>

        {step === 0 && renderForm()}

        {step === 1 && (
          <div style={{ padding: 25, paddingTop: 40 }}>
            <Title level={3} style={{ textAlign: "center", marginBottom: 30, fontWeight: 800 }}>{t.confirmDetails}</Title>

            <Card style={{ borderRadius: 30, boxShadow: '0 10px 30px rgba(0,0,0,0.08)', border: 'none', overflow: 'hidden' }}>
              <div style={{ background: '#fff7e6', margin: '-24px -24px 20px -24px', padding: '20px', textAlign: 'center' }}>
                 <CarOutlined style={{ fontSize: 40, color: '#fa541c', marginBottom: 10 }} />
                 <Title level={5} style={{ margin: 0, color: '#fa541c' }}>YUK TASHISH</Title>
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
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">{t.departureDate}</Text>
                    <Text strong>{formData.date} | {formData.time}</Text>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text type="secondary">Mashina</Text>
                    <Text strong>{formData.carType.toUpperCase()}</Text>
                 </div>
                 <Divider style={{ margin: "5px 0" }} />
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text type="secondary">{t.price}</Text>
                    <Title level={4} style={{ margin: 0, color: '#fa541c' }}>{priceType === "deal" ? "Kelishuv" : `${formData.price} ${t.som}`}</Title>
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
               <Card style={{ textAlign: "center", borderRadius: 32, boxShadow: "0 15px 40px rgba(250, 84, 28, 0.15)", border: 'none' }}>
                 <div style={{ marginBottom: 20, background: '#fff7e6', width: 100, height: 100, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <CheckCircleOutlined style={{ fontSize: 50, color: "#fa541c" }} />
                 </div>
                 <Title level={3} style={{ fontWeight: 800 }}>{t.adActive}</Title>
                 <Divider style={{ margin: "25px 0" }} />

                 <Row justify="space-between" align="middle">
                   <Col span={10}><Text type="secondary" style={{fontSize: 10}}>{t.qayerdan}</Text><Title level={5} style={{margin:0}}>{formData.fromDistrict}</Title></Col>
                   <Col span={4}><Text strong style={{fontSize: 20}}>→</Text></Col>
                   <Col span={10}><Text type="secondary" style={{fontSize: 10}}>{t.qayerga}</Text><Title level={5} style={{margin:0}}>{formData.toDistrict}</Title></Col>
                 </Row>

                 <div style={{ marginTop: 25, background: '#fafafa', padding: 15, borderRadius: 16 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Sizning yuk tashish e'loningiz faol va mijozlarga ko'rinmoqda.</Text>
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