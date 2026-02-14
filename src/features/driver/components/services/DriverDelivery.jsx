import React, { useState, useEffect } from "react";
import { 
  Card, Button, Typography, Row, Col, InputNumber, 
  Space, message, ConfigProvider, Divider, 
  Select, DatePicker, TimePicker, Radio, Checkbox, Tag, Skeleton 
} from "antd";
import { 
  ArrowLeftOutlined, CalendarOutlined, ClockCircleOutlined,
  CheckCircleOutlined, RocketOutlined, DeleteOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import { translations } from '@i18n/translations';
import api from "@/utils/apiHelper"; // ✅ YANGI: Serverga ulanish

const { Title, Text } = Typography;
const { Option } = Select;

export default function DriverDelivery({ onBack }) {
  const savedLang = localStorage.getItem("appLang") || "uz_lotin";
  const t = translations[savedLang] || translations["uz_lotin"];

  // State
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState(localStorage.getItem("activeDeliveryId"));
  const [priceType, setPriceType] = useState("deal");

  const [formData, setFormData] = useState({
    fromRegion: "Qoraqalpog'iston Respublikasi",
    fromDistrict: "Nukus",
    toRegion: "Qoraqalpog'iston Respublikasi",
    toDistrict: "Chimboy",
    date: dayjs(),
    time: dayjs().add(1, 'hour'),
    price: 0,
    isExpress: false
  });

  // Hududlar (Backend bilan bir xil bo'lishi kerak)
  const regions = [
    { name: "Qoraqalpog'iston Respublikasi", districts: ["Nukus", "Chimboy", "Qo'ng'irot", "Beruniy", "To'rtko'l", "Mo'ynoq", "Xo'jayli", "Shumanay", "Qanlikol", "Kegeyli", "Qorao'zak", "Taxtako'pir", "Ellikqala", "Amudaryo", "Nukus tumani", "Bo'zatov"] },
    { name: "Toshkent shahri", districts: ["Yunusobod", "Chilonzor", "Mirzo Ulug'bek", "Yashnobod", "Yakkasaroy", "Sergeli", "Uchtepa", "Olmazor", "Bektemir", "Mirobod", "Shayxontohur", "Yangihayot"] },
    // ... boshqa viloyatlar
  ];

  // 1. Aktiv e'lonni tekshirish
  useEffect(() => {
    checkActiveAd();
  }, []);

  const checkActiveAd = async () => {
    setLoading(true);
    const savedId = localStorage.getItem("activeDeliveryId");

    if (savedId) {
      try {
        const res = await api.post("/api/order", { action: "status", orderId: savedId });
        const order = res?.data?.order || res?.order;

        if (order && order.status !== 'completed' && order.status !== 'cancelled') {
          setActiveOrderId(savedId);
          setFormData({
            ...formData,
            fromRegion: order.from_region || "Qoraqalpog'iston Respublikasi",
            fromDistrict: order.from_district || "Nukus",
            toRegion: order.to_region || "Qoraqalpog'iston Respublikasi",
            toDistrict: order.to_district || "Chimboy",
            date: order.scheduled_at ? dayjs(order.scheduled_at) : dayjs(),
            time: order.scheduled_at ? dayjs(order.scheduled_at) : dayjs(),
            price: order.price || 0,
            isExpress: order.vehicle_type === 'express' // Express belgisi
          });
          setPriceType(order.price > 0 ? "start" : "deal");
          setStep(2); // Aktiv sahifaga o'tkazish
        } else {
          localStorage.removeItem("activeDeliveryId");
          setStep(0);
        }
      } catch (e) {
        console.error("Order check failed", e);
      }
    }
    setLoading(false);
  };

  const handleRegionChange = (value, type) => {
    const selectedRegion = regions.find(r => r.name === value);
    if (type === "from") {
      setFormData({ ...formData, fromRegion: value, fromDistrict: selectedRegion.districts[0] });
    } else {
      setFormData({ ...formData, toRegion: value, toDistrict: selectedRegion.districts[0] });
    }
  };

  // 2. E'lon yaratish (Serverga)
  const handleSave = async () => {
    setSubmitting(true);
    try {
      const scheduledAt = dayjs(formData.date)
        .hour(formData.time.hour())
        .minute(formData.time.minute());

      const payload = {
        action: "create",
        service_type: "delivery", // Eltish xizmati
        status: "searching",
        from_region: formData.fromRegion,
        from_district: formData.fromDistrict,
        to_region: formData.toRegion,
        to_district: formData.toDistrict,
        price: priceType === 'deal' ? 0 : formData.price,
        vehicle_type: formData.isExpress ? 'express' : 'standard', // Express yoki oddiy
        scheduled_at: scheduledAt.toISOString(),
        pickup_location: formData.fromDistrict,
        dropoff_location: formData.toDistrict
      };

      const res = await api.post("/api/order", payload);

      if (res.success || res.orderId) {
        const newId = res.orderId || res.data.orderId;
        localStorage.setItem("activeDeliveryId", newId);
        setActiveOrderId(newId);
        setStep(2);
        message.success("Eltish xizmati e'loni joylandi!");
      } else {
        message.error("Xatolik yuz berdi");
      }
    } catch (e) {
      console.error(e);
      message.error("Internet bilan aloqa yo'q");
    } finally {
      setSubmitting(false);
    }
  };

  // 3. E'lonni o'chirish
  const handleCancelAd = async () => {
    if (!activeOrderId) return;
    setSubmitting(true);
    try {
      await api.post("/api/order", { action: "cancel", orderId: activeOrderId });
      localStorage.removeItem("activeDeliveryId");
      setActiveOrderId(null);
      setStep(0);
      message.warning("E'lon o'chirildi");
    } catch (e) {
      message.error("Bekor qilishda xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  const btnTouchProps = {
    onMouseDown: (e) => e.currentTarget.style.transform = "scale(0.97)",
    onMouseUp: (e) => e.currentTarget.style.transform = "scale(1)",
    onTouchStart: (e) => e.currentTarget.style.transform = "scale(0.97)",
    onTouchEnd: (e) => e.currentTarget.style.transform = "scale(1)",
    style: { transition: "transform 0.1s" }
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
          <DatePicker value={formData.date} format="YYYY-MM-DD" onChange={(d) => setFormData({...formData, date: d})} variant="borderless" style={{ fontWeight: 'bold' }} allowClear={false} />
        </Row>
        <Divider style={{ margin: "5px 0" }} />
        <Row justify="space-between" align="middle" style={{ marginTop: 15 }}>
          <Space><ClockCircleOutlined style={{ color: '#52c41a' }} /> <Text strong>{t.departureTime}</Text></Space>
          <TimePicker format="HH:mm" value={formData.time} onChange={(t) => setFormData({...formData, time: t})} variant="borderless" style={{ fontWeight: 'bold' }} allowClear={false} />
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
        <Divider style={{ margin: "15px 0" }} />
        <Checkbox checked={formData.isExpress} onChange={e => setFormData({...formData, isExpress: e.target.checked})}>
          <Text strong style={{color: '#faad14'}}>Express (Tezkor yetkazish)</Text>
        </Checkbox>
      </Card>

      <Button 
        block type="primary" size="large" 
        onClick={() => setStep(1)} 
        {...btnTouchProps}
        style={{ 
           height: 60, borderRadius: 18, background: "#52c41a", fontWeight: "800", fontSize: 18,
           boxShadow: '0 8px 20px rgba(82,196,26,0.4)', border: 'none', ...btnTouchProps.style
        }}
      >
        DAVOM ETISH
      </Button>
    </div>
  );

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#52c41a', borderRadius: 12 } }}>
      <div style={{ minHeight: "100vh", background: "#fff" }}>

        {loading && step === 0 ? (
           <div style={{ padding: 20 }}>
              <Skeleton active paragraph={{ rows: 3 }} />
              <br />
              <Skeleton.Button active block style={{ height: 60, borderRadius: 18 }} />
           </div>
        ) : (
          <>
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
                        <Title level={4} style={{ margin: 0, color: '#52c41a' }}>{priceType === "deal" ? "Kelishuv" : `${formData.price.toLocaleString()} ${t.som}`}</Title>
                     </div>
                  </Space>
                </Card>

                <Space direction="vertical" style={{ width: "100%", marginTop: 40 }} size={15}>
                  <Button 
                     block type="primary" size="large" 
                     loading={submitting}
                     style={{ height: 60, borderRadius: 18, background: "#000", fontWeight: 700, fontSize: 16 }} 
                     onClick={handleSave}
                  >
                     E'LONNI JOYLASHTIRISH
                  </Button>
                  <Button block size="large" type="text" onClick={() => setStep(0)} style={{ height: 50, color: '#888' }}>
                     {t.back.toUpperCase()}
                  </Button>
                </Space>
              </div>
            )}

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
                     {...btnTouchProps}
                     style={{ background: "#000", height: 60, borderRadius: 18, fontWeight: 700, ...btnTouchProps.style }} 
                     onClick={onBack}
                  >
                    MENYUGA QAYTISH
                  </Button>
                  <Button 
                     block danger ghost size="large" icon={<DeleteOutlined />} 
                     loading={submitting}
                     {...btnTouchProps}
                     style={{ height: 60, borderRadius: 18, border: '2px solid #ff4d4f', fontWeight: 600, ...btnTouchProps.style }} 
                     onClick={handleCancelAd}
                  >
                    E'LONNI O'CHIRISH
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