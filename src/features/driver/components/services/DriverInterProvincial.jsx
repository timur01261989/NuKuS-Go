import React, { useState, useEffect } from "react";
import { 
  Card, Button, Typography, Row, Col, 
  TimePicker, DatePicker, InputNumber, Space, Switch, 
  message, ConfigProvider, Divider, Select, Checkbox, Tag, Skeleton 
} from "antd";
import { 
  ArrowLeftOutlined, EnvironmentOutlined, 
  ClockCircleOutlined, UserOutlined, 
  CalendarOutlined, ShoppingOutlined,
  CheckCircleOutlined, DeleteOutlined, SendOutlined,
  GlobalOutlined, EnvironmentFilled
} from "@ant-design/icons";
import dayjs from "dayjs";
import { translations } from "../../../pages/translations";
import { supabase } from "../../../pages/supabase"; 

const { Title, Text } = Typography;
const { Option } = Select;

export default function DriverInterProvincial({ onBack }) {
  const savedLang = localStorage.getItem("appLang") || "uz_lotin";
  const t = translations[savedLang] || translations["uz_lotin"];
  const [loading, setLoading] = useState(true); // Skeleton uchun

  // --- MA'LUMOTLAR BAZASI (TO'LIQ RO'YXAT) ---
  const regionsData = [
    { 
      name: "Toshkent shahri", 
      districts: ["Yunusobod", "Chilonzor", "Mirzo Ulug'bek", "Yashnobod", "Yakkasaroy", "Sergeli", "Uchtepa", "Olmazor", "Bektemir", "Mirobod", "Shayxontohur", "Yangihayot"] 
    },
    { 
      name: "Qoraqalpog'iston", 
      districts: ["Nukus sh.", "Chimboy", "Qo'ng'irot", "Beruniy", "To'rtko'l", "Mo'ynoq", "Xo'jayli", "Shumanay", "Qanliko'l", "Kegeyli", "Qorao'zak", "Taxtako'pir", "Ellikqala", "Amudaryo", "Bo'zatov", "Nukus tumani"] 
    },
    { 
      name: "Toshkent viloyati", 
      districts: ["Nurafshon", "Angren", "Olmaliq", "Chirchiq", "Bekobod", "Yangiyo'l", "Oqqo'rg'on", "Ohangaron", "Bo'stonliq", "Bo'ka", "Zangiota", "Qibray", "Quyichirchiq", "Parkent", "Piskent", "O'rtachirchiq", "Chinoz", "Yuqorichirchiq", "Toshkent tumani"] 
    },
    { 
      name: "Andijon", 
      districts: ["Andijon sh.", "Asaka", "Xonobod", "Shahrixon", "Oltinkul", "Baliqchi", "Bo'z", "Buloqboshi", "Izboskan", "Jalaquduq", "Marhamat", "Paxtaobod", "Qo'rg'ontepa", "Xo'jaobod"] 
    },
    { 
      name: "Buxoro", 
      districts: ["Buxoro sh.", "Kogon", "G'ijduvon", "Jondor", "Qorako'l", "Qorovulbozor", "Olot", "Peshku", "Romitan", "Shofirkon", "Vobkent"] 
    },
    { 
      name: "Farg'ona", 
      districts: ["Farg'ona sh.", "Qo'qon", "Marg'ilon", "Quva", "Quvasoy", "Beshariq", "Bog'dod", "Buvayda", "Dang'ara", "Yozyovon", "Oltiariq", "Rishton", "So'x", "Toshloq", "Uchko'prik", "O'zbekiston", "Furqat"] 
    },
    { 
      name: "Jizzax", 
      districts: ["Jizzax sh.", "Arnasoy", "Baxmal", "Do'stlik", "Forish", "G'allaorol", "Sharof Rashidov", "Mirzachul", "Paxtakor", "Yangiobod", "Zomin", "Zafarobod"] 
    },
    { 
      name: "Xorazm", 
      districts: ["Urganch sh.", "Xiva", "Bog'ot", "Gurlan", "Qo'shko'pir", "Shovot", "Xonqa", "Yangiariq", "Yangibozor", "Tuproqqala", "Hazorasp"] 
    },
    { 
      name: "Namangan", 
      districts: ["Namangan sh.", "Chust", "Pop", "Chortoq", "Kosonsoy", "Mingbuloq", "Norin", "Uychi", "Uchqo'rg'on", "Yangiqo'rg'on", "To'raqo'rg'on"] 
    },
    { 
      name: "Navoiy", 
      districts: ["Navoiy sh.", "Zarafshon", "Karmana", "Konimex", "Navbahor", "Nurota", "Tomdi", "Uchquduq", "Xatirchi", "Qiziltepa"] 
    },
    { 
      name: "Qashqadaryo", 
      districts: ["Qarshi sh.", "Shahrisabz", "Muborak", "Dehqonobod", "Kasbi", "Kitob", "Koson", "Mirishkor", "Nishon", "Chiroqchi", "Yakkabog'", "Qamashi", "G'uzor"] 
    },
    { 
      name: "Samarqand", 
      districts: ["Samarqand sh.", "Kattaqo'rg'on", "Ishtixon", "Jomboy", "Narpay", "Nurobod", "Oqdaryo", "Paxtachi", "Payariq", "Pastdarg'om", "Toyloq", "Bulung'ur", "Urgut"] 
    },
    { 
      name: "Sirdaryo", 
      districts: ["Guliston sh.", "Shirin", "Yangiyer", "Boyovut", "Mirzaobod", "Oqoltin", "Sayhunobod", "Sardoba", "Xovos"] 
    },
    { 
      name: "Surxondaryo", 
      districts: ["Termiz sh.", "Angor", "Boysun", "Denov", "Jarqo'rg'on", "Muzrabot", "Oltinsoy", "Sariosiyo", "Sherobod", "Sho'rchi", "Uzun", "Qiziriq", "Qumqo'rg'on"] 
    }
  ];

  // E'lon holatini o'qish
  const savedAd = JSON.parse(localStorage.getItem("activeInterProvincialAd"));
  const [step, setStep] = useState(savedAd ? 2 : 0);

  const [formData, setFormData] = useState(savedAd || {
    fromRegion: "Qoraqalpog'iston",
    fromDistrict: "Nukus sh.",
    toRegion: "Toshkent shahri",
    toDistrict: "Yunusobod",
    date: dayjs().format("YYYY-MM-DD"),
    time: "09:00",
    price: 150000,
    seats: 4,
    addToDelivery: false
  });

  // Dastlabki yuklanish effekti
  useEffect(() => {
    setTimeout(() => setLoading(false), 600);
  }, []);

  // --- MANTIQ: Viloyat o'zgarganda tumanlarni yangilash ---
  const handleRegionChange = (value, type) => {
    const selectedRegion = regionsData.find(r => r.name === value);
    if (!selectedRegion) return;

    if (type === "from") {
      setFormData({ 
        ...formData, 
        fromRegion: value, 
        fromDistrict: selectedRegion.districts[0] // Avtomatik 1-tumanni tanlash
      });
    } else {
      setFormData({ 
        ...formData, 
        toRegion: value, 
        toDistrict: selectedRegion.districts[0] 
      });
    }
  };

  const handleSave = () => {
    localStorage.setItem("activeInterProvincialAd", JSON.stringify(formData));
    setStep(2);
    message.success(t.adActive);
  };

  const handleCancelAd = () => {
    localStorage.removeItem("activeInterProvincialAd");
    setStep(0);
    message.warning(t.cancelAd);
  };

  const renderForm = () => (
    <div style={{ padding: "15px", background: "#f8f9fa", minHeight: "100vh" }}>
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 25 }}>
        <Button shape="circle" size="large" icon={<ArrowLeftOutlined />} onClick={onBack} style={{ border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
        <Title level={4} style={{ margin: "0 0 0 15px", color: "#1890ff", fontWeight: 800 }}>{t.interProvincial}</Title>
      </div>

      <Card bordered={false} style={{ borderRadius: 24, marginBottom: 15, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 15 }}>
           {/* Marshrut chizig'i */}
           <div style={{ position: 'absolute', left: 8, top: 18, bottom: 38, width: 2, background: '#e0e0e0', zIndex: 0 }}></div>

           {/* QAYERDAN */}
           <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                 <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#1890ff', border: '3px solid white', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }} />
                 <Text type="secondary" style={{fontSize: 12, fontWeight: 600}}>{t.qayerdan}</Text>
              </div>
              <div style={{ paddingLeft: 28 }}>
                 <Select 
                   value={formData.fromRegion} 
                   onChange={val => handleRegionChange(val, "from")} 
                   style={{ width: "100%", marginBottom: 8 }} 
                   size="large" variant="borderless"
                   suffixIcon={null}
                 >
                   {regionsData.map(r => <Option key={r.name} value={r.name}>{r.name}</Option>)}
                 </Select>
                 <Select 
                   value={formData.fromDistrict} 
                   onChange={val => setFormData({...formData, fromDistrict: val})} 
                   style={{ width: "100%", borderBottom: '1px solid #f0f0f0' }}
                   size="large" variant="borderless"
                 >
                   {regionsData.find(r => r.name === formData.fromRegion)?.districts.map(d => (
                     <Option key={d} value={d}>{d}</Option>
                   ))}
                 </Select>
              </div>
           </div>

           {/* QAYERGA */}
           <div style={{ position: 'relative', zIndex: 1, marginTop: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                 <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#52c41a', border: '3px solid white', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }} />
                 <Text type="secondary" style={{fontSize: 12, fontWeight: 600}}>{t.qayerga}</Text>
              </div>
              <div style={{ paddingLeft: 28 }}>
                 <Select 
                   value={formData.toRegion} 
                   onChange={val => handleRegionChange(val, "to")} 
                   style={{ width: "100%", marginBottom: 8 }} 
                   size="large" variant="borderless"
                   suffixIcon={null}
                 >
                   {regionsData.map(r => <Option key={r.name} value={r.name}>{r.name}</Option>)}
                 </Select>
                 <Select 
                   value={formData.toDistrict} 
                   onChange={val => setFormData({...formData, toDistrict: val})} 
                   style={{ width: "100%" }}
                   size="large" variant="borderless"
                 >
                   {regionsData.find(r => r.name === formData.toRegion)?.districts.map(d => (
                     <Option key={d} value={d}>{d}</Option>
                   ))}
                 </Select>
              </div>
           </div>
        </div>
      </Card>

      {/* ELTISH INTEGRATSIYASI */}
      <Card style={{ borderRadius: 24, marginBottom: 15, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", border: formData.addToDelivery ? "1px solid #52c41a" : "none" }}>
        <Checkbox checked={formData.addToDelivery} onChange={e => setFormData({...formData, addToDelivery: e.target.checked})}>
          <Space>
            <SendOutlined style={{ color: "#52c41a", fontSize: 18 }} />
            <Text strong>{t.addToDelivery || "Eltish xizmatiga ham qo'shish"}</Text>
          </Space>
        </Checkbox>
      </Card>

      {/* VAQT, SANA, NARX */}
      <Card style={{ marginBottom: 15, borderRadius: 24, border: 'none', boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 15 }}>
          <Space><CalendarOutlined style={{ color: '#1890ff' }} /> <Text strong>{t.departureDate}</Text></Space>
          <DatePicker defaultValue={dayjs(formData.date)} format="YYYY-MM-DD" variant="borderless" onChange={(d, s) => setFormData({...formData, date: s})} style={{ width: 130, fontWeight: 'bold' }} />
        </Row>
        <Divider style={{ margin: "5px 0" }} />
        <Row justify="space-between" align="middle" style={{ marginTop: 15 }}>
          <Space><ClockCircleOutlined style={{ color: '#1890ff' }} /> <Text strong>{t.departureTime}</Text></Space>
          <TimePicker format="HH:mm" value={dayjs(formData.time, "HH:mm")} onChange={(v, s) => setFormData({...formData, time: s})} variant="borderless" style={{ width: 80, fontWeight: 'bold' }} />
        </Row>
      </Card>

      <Row gutter={15}>
         <Col span={12}>
            <Card style={{ borderRadius: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", border: 'none', height: '100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
               <Space direction="vertical" align="center" size={0}>
                  <Text type="secondary" style={{fontSize: 12}}>{t.availableSeats}</Text>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 5 }}>
                     <Button shape="circle" size="small" onClick={() => setFormData({...formData, seats: Math.max(1, formData.seats - 1)})}>-</Button>
                     <Text strong style={{ fontSize: 18 }}>{formData.seats}</Text>
                     <Button shape="circle" size="small" onClick={() => setFormData({...formData, seats: formData.seats + 1})}>+</Button>
                  </div>
               </Space>
            </Card>
         </Col>
         <Col span={12}>
            <Card style={{ borderRadius: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", border: 'none', height: '100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
               <Space direction="vertical" align="center" size={0}>
                  <Text type="secondary" style={{fontSize: 12}}>{t.pricePerPerson}</Text>
                  <InputNumber 
                     variant="borderless" 
                     style={{ width: "100%", marginTop: 5, textAlign: 'center', fontWeight: 'bold', fontSize: 16 }} 
                     value={formData.price} 
                     onChange={val => setFormData({...formData, price: val})} 
                     formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  />
               </Space>
            </Card>
         </Col>
      </Row>

      <Button 
        block type="primary" size="large" 
        onClick={() => setStep(1)} 
        style={{ 
           height: 60, borderRadius: 18, background: "#1890ff", fontWeight: "800", fontSize: 18, marginTop: 20,
           boxShadow: '0 8px 20px rgba(24,144,255,0.4)', border: 'none', transition: 'transform 0.1s'
        }}
        onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.97)"}
        onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
        onTouchStart={(e) => e.currentTarget.style.transform = "scale(0.97)"}
        onTouchEnd={(e) => e.currentTarget.style.transform = "scale(1)"}
      >
        {(t.createAd || t.create).toUpperCase()}
      </Button>
    </div>
  );

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#1890ff', borderRadius: 12 } }}>
      <div style={{ minHeight: "100vh", background: "#fff", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div style={{ padding: "15px 15px 0" }}>
           <Button shape="circle" size="large" icon={<ArrowLeftOutlined />} onClick={() => (step === 2 || step === 0) ? onBack() : setStep(0)} style={{ border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
        </div>

        {/* LOADING SKELETON */}
        {loading && step === 0 ? (
           <div style={{ padding: 20 }}>
              <Skeleton active paragraph={{ rows: 4 }} />
              <br />
              <Skeleton.Button active block style={{ height: 100, borderRadius: 20, marginBottom: 15 }} />
              <Skeleton.Button active block style={{ height: 60, borderRadius: 20 }} />
           </div>
        ) : (
          <>
            {step === 0 && renderForm()}

            {step === 1 && (
              <div style={{ padding: 25, paddingTop: 40 }}>
                <Title level={3} style={{ textAlign: "center", marginBottom: 30, fontWeight: 800 }}>{t.confirmDetails}</Title>
                <Card style={{ borderRadius: 30, boxShadow: '0 10px 30px rgba(0,0,0,0.08)', border: 'none', padding: 10 }}>
                  <Space direction="vertical" style={{width:'100%'}} size="middle">
                     <div>
                        <Text type="secondary">{t.qayerdan}</Text>
                        <Title level={5} style={{margin:0}}>{formData.fromDistrict}, {formData.fromRegion}</Title>
                     </div>
                     <div style={{ borderLeft: '2px solid #eee', paddingLeft: 10 }}>
                        <Text type="secondary">{t.qayerga}</Text>
                        <Title level={5} style={{margin:0}}>{formData.toDistrict}, {formData.toRegion}</Title>
                     </div>
                     <Divider style={{ margin: "5px 0" }} />
                     <Row gutter={[16, 16]}>
                        <Col span={12}><Text type="secondary">{t.departureTime}</Text><div style={{fontWeight:'bold', fontSize: 16}}>{formData.date} {formData.time}</div></Col>
                        <Col span={12}><Text type="secondary">{t.price}</Text><div style={{fontWeight:'bold', fontSize: 16, color: '#1890ff'}}>{formData.price} {t.som}</div></Col>
                     </Row>
                  </Space>
                </Card>
                <div style={{ marginTop: 40, display: "flex", flexDirection: 'column', gap: 15 }}>
                  <Button 
                     block size="large" type="primary" 
                     style={{ background: "#000", height: 60, borderRadius: 18, fontWeight: 700 }}
                     onClick={handleSave}
                  >
                     {t.save.toUpperCase()}
                  </Button>
                  <Button block size="large" type="text" onClick={() => setStep(0)} style={{ height: 50, color: '#888' }}>
                     {t.back.toUpperCase()}
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div style={{ padding: 25, height: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Card style={{ textAlign: "center", borderRadius: 32, boxShadow: "0 15px 40px rgba(24,144,255,0.15)", border: 'none' }}>
                  <GlobalOutlined style={{ fontSize: 60, color: "#1890ff", marginBottom: 20 }} />
                  <Title level={3} style={{ fontWeight: 800 }}>{t.adActive}</Title>
                  {formData.addToDelivery && <Tag color="green" icon={<SendOutlined />} style={{ padding: '5px 15px', borderRadius: 20, fontSize: 12 }}>{t.deliveryActive}</Tag>}
                  <Divider style={{ margin: "25px 0" }} />
                  <Row justify="space-around" align="middle">
                    <Col span={10}><Text type="secondary" style={{fontSize: 10}}>{t.qayerdan}</Text><Title level={5} style={{margin:0}}>{formData.fromDistrict}</Title></Col>
                    <Col span={4}><Text strong>→</Text></Col>
                    <Col span={10}><Text type="secondary" style={{fontSize: 10}}>{t.qayerga}</Text><Title level={5} style={{margin:0}}>{formData.toDistrict}</Title></Col>
                  </Row>
                  <Divider />
                  <Space direction="vertical">
                     <Text type="secondary">{formData.date} | {formData.time}</Text>
                     <Text strong style={{ fontSize: 16 }}>{formData.seats} ta bo'sh joy</Text>
                  </Space>
                </Card>

                <Space direction="vertical" size={15} style={{ width: "100%", marginTop: 40 }}>
                  <Button 
                     block type="primary" size="large" 
                     style={{ background: "black", height: 60, borderRadius: 18, fontWeight: 700 }} 
                     onClick={onBack}
                  >
                    {t.backToMenu}
                  </Button>
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
          </>
        )}
      </div>
    </ConfigProvider>
  );
}