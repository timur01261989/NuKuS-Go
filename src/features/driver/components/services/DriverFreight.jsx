import React, { useState, useEffect } from "react";
import { 
  Card, Button, Typography, Row, Col, InputNumber, 
  Space, message, ConfigProvider, Divider, 
  Select, DatePicker, TimePicker, Radio, Checkbox, Skeleton
} from "antd";
import { 
  ArrowLeftOutlined, CalendarOutlined, ClockCircleOutlined,
  CheckCircleOutlined, DeleteOutlined, CarOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import { translations } from '@i18n/translations';
import api from "@/utils/apiHelper"; // ✅ YANGI: Serverga ulanish

const { Title, Text } = Typography;
const { Option } = Select;

export default function DriverFreight({ onBack }) {
  const savedLang = localStorage.getItem("appLang") || "uz_lotin";
  const t = translations[savedLang] || translations["uz_lotin"];

  // State
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState(localStorage.getItem("activeFreightId"));
  const [priceType, setPriceType] = useState("deal");

  // Hududlar (Backend bilan bir xil bo'lishi kerak)
  const regions = [
    { name: "Qoraqalpog'iston Respublikasi", districts: [t.nukus, t.chimboy, t.qongirot, t.beruniy, t.tortkol, t.moynoq, t.xojayli, t.shumanay, t.qanlikol, t.kegeyli, t.qoraozak, t.taxtakopir, "Ellikqala", "Amudaryo", "Bo'zatov"] },
    { name: "Toshkent shahri", districts: ["Yunusobod", "Chilonzor", "Mirzo Ulug'bek", "Yashnobod", "Yakkasaroy", "Sergeli", "Uchtepa", "Olmazor", "Bektemir", "Mirobod", "Shayxontohur", "Yangihayot"] },
    { name: "Toshkent viloyati", districts: ["Nurafshon sh.", "Angren", "Olmaliq", "Chirchiq", "Bekobod", "Yangiyo'l", "Oqqo'rg'on", "Ohangaron", "Bo'stonliq", "Bo'ka", "Zangiota", "Qibray", "Parkent", "Piskent", "Chinoz"] },
    { name: "Xorazm", districts: ["Urganch sh.", "Xiva", "Bog'ot", "Gurlan", "Qo'shko'pir", "Shovot", "Xonqa", "Yangiariq", "Yangibozor", "Tuproqqala"] },
    // ... (boshqa viloyatlar qisqartirildi, o'zingizniki qolaversin)
  ];

  const [formData, setFormData] = useState({
    fromRegion: "Qoraqalpog'iston Respublikasi",
    fromDistrict: t.nukus,
    toRegion: "Toshkent shahri",
    toDistrict: "Yunusobod",
    date: dayjs(),
    time: dayjs().add(1, 'hour'),
    carType: "gazel",
    price: 0,
    hasPassenger: false
  });

  // 1. Ilova ochilganda aktiv e'lonni tekshirish
  useEffect(() => {
    checkActiveAd();
  }, []);

  const checkActiveAd = async () => {
    setLoading(true);
    const savedId = localStorage.getItem("activeFreightId");

    if (savedId) {
      try {
        const res = await api.post("/api/order", { action: "status", orderId: savedId });
        const order = res?.data?.order || res?.order;

        if (order && order.status !== 'completed' && order.status !== 'cancelled') {
          setActiveOrderId(savedId);
          setFormData({
            ...formData,
            fromRegion: order.from_region || "Qoraqalpog'iston Respublikasi",
            fromDistrict: order.from_district || t.nukus,
            toRegion: order.to_region || "Toshkent shahri",
            toDistrict: order.to_district || "Yunusobod",
            date: order.scheduled_at ? dayjs(order.scheduled_at) : dayjs(),
            time: order.scheduled_at ? dayjs(order.scheduled_at) : dayjs(),
            price: order.price || 0,
            carType: order.vehicle_type || "gazel",
            hasPassenger: order.has_passenger || false
          });
          setPriceType(order.price > 0 ? "start" : "deal");
          setStep(2); // Aktiv sahifaga o'tkazish
        } else {
          localStorage.removeItem("activeFreightId");
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
      // Vaqtni birlashtirish
      const scheduledAt = dayjs(formData.date)
        .hour(formData.time.hour())
        .minute(formData.time.minute());

      const payload = {
        action: "create",
        service_type: "freight", // Yuk tashish
        status: "searching",
        from_region: formData.fromRegion,
        from_district: formData.fromDistrict,
        to_region: formData.toRegion,
        to_district: formData.toDistrict,
        price: priceType === 'deal' ? 0 : formData.price,
        vehicle_type: formData.carType,
        has_passenger: formData.hasPassenger,
        scheduled_at: scheduledAt.toISOString(),
        pickup_location: formData.fromDistrict,
        dropoff_location: formData.toDistrict
      };

      const res = await api.post("/api/order", payload);

      if (res.success || res.orderId) {
        const newId = res.orderId || res.data.orderId;
        localStorage.setItem("activeFreightId", newId);
        setActiveOrderId(newId);
        setStep(2);
        message.success("Yuk tashish e'loni joylandi!");
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

  // 3. E'lonni bekor qilish
  const handleCancelAd = async () => {
    if (!activeOrderId) return;
    setSubmitting(true);
    try {
      await api.post("/api/order", { action: "cancel", orderId: activeOrderId });
      localStorage.removeItem("activeFreightId");
      setActiveOrderId(null);
      setStep(0);
      message.warning("E'lon bekor qilindi");
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

  // --- STEP 0: FORM ---
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
          <DatePicker value={formData.date} format="YYYY-MM-DD" onChange={(d) => setFormData({...formData, date: d})} variant="borderless" style={{ fontWeight: 'bold' }} allowClear={false} />
        </Row>
        <Divider style={{ margin: "5px 0" }} />
        <Row justify="space-between" align="middle" style={{ marginTop: 15 }}>
          <Space><ClockCircleOutlined style={{ color: '#fa541c' }} /> <Text strong>{t.departureTime}</Text></Space>
          <TimePicker format="HH:mm" value={formData.time} onChange={(t) => setFormData({...formData, time: t})} variant="borderless" style={{ fontWeight: 'bold' }} allowClear={false} />
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
             formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 
             placeholder="Summani kiriting"
          />
        )}
      </Card>

      <Button 
        block type="primary" size="large" 
        onClick={() => setStep(1)} 
        {...btnTouchProps}
        style={{ 
           height: 60, borderRadius: 18, background: "#fa541c", fontWeight: "800", fontSize: 18,
           boxShadow: '0 8px 20px rgba(250, 84, 28, 0.4)', border: 'none', ...btnTouchProps.style
        }}
      >
        {t.create.toUpperCase()}
      </Button>
    </div>
  );

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#fa541c', borderRadius: 12 } }}>
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
                        <Text strong>{formData.date.format('YYYY-MM-DD')} | {formData.time.format('HH:mm')}</Text>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text type="secondary">Mashina</Text>
                        <Text strong>{formData.carType.toUpperCase()}</Text>
                     </div>
                     <Divider style={{ margin: "5px 0" }} />
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text type="secondary">{t.price}</Text>
                        <Title level={4} style={{ margin: 0, color: '#fa541c' }}>{priceType === "deal" ? "Kelishuv" : `${formData.price.toLocaleString()} ${t.som}`}</Title>
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
                     {t.save.toUpperCase()}
                  </Button>
                  <Button block size="large" type="text" onClick={() => setStep(0)} style={{ height: 50, color: '#888' }}>
                     {t.back.toUpperCase()}
                  </Button>
                </Space>
              </div>
            )}

            {step === 2 && (
              <div style={{ padding: 25, height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Card style={{ textAlign: "center", borderRadius: 32, boxShadow: "0 15px 40px rgba(250, 84, 28, 0.15)", border: 'none' }}>
                   <div style={{ marginBottom: 20, background: '#fff7e6', width: 100, height: 100, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                      <CheckCircleOutlined style={{ fontSize: 50, color: "#fa541c" }} />
                   </div>
                   <Title level={3} style={{ fontWeight: 800 }}>{t.adActive}</Title>
                   
                   <div style={{ marginTop: 20, background: '#fafafa', padding: 15, borderRadius: 16 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>Sizning yuk tashish e'loningiz faol va mijozlarga ko'rinmoqda.</Text>
                   </div>
                </Card>

                <Space direction="vertical" size={15} style={{ width: "100%", marginTop: 40 }}>
                  <Button 
                     block type="primary" size="large" 
                     {...btnTouchProps}
                     style={{ background: "#000", height: 60, borderRadius: 18, fontWeight: 700, ...btnTouchProps.style }} 
                     onClick={onBack}
                  >
                    {t.backToMenu}
                  </Button>
                  <Button 
                     block danger ghost size="large" icon={<DeleteOutlined />} 
                     loading={submitting}
                     {...btnTouchProps}
                     style={{ height: 60, borderRadius: 18, border: '2px solid #ff4d4f', fontWeight: 600, ...btnTouchProps.style }} 
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