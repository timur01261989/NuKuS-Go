import React, { useState, useEffect } from "react";
import { 
  Card, Button, Typography, Row, Col, Input, 
  TimePicker, InputNumber, Space, Switch, message, 
  ConfigProvider, Divider, Alert, Select, Progress, Checkbox, Tag, Skeleton
} from "antd";
import { 
  ArrowLeftOutlined, ClockCircleOutlined, UserOutlined, 
  CheckCircleOutlined, CompassOutlined, ShoppingOutlined,
  SendOutlined, DeleteOutlined, EnvironmentFilled, CarOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import { translations } from '@i18n/translations';
import api from "@/utils/apiHelper"; // ✅ YANGI: Serverga ulanish

const { Title, Text } = Typography;
const { Option } = Select;

export default function DriverInterDistrict({ onBack }) {
  const savedLang = localStorage.getItem("appLang") || "uz_lotin";
  const t = translations[savedLang] || translations["uz_lotin"];

  // State
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState(localStorage.getItem("activeInterDistrictId"));

  const [formData, setFormData] = useState({
    from: "Nukus",
    to: "Chimboy",
    time: dayjs().add(1, 'hour'), // Default: 1 soat keyin
    price: 20000,
    seats: 4,
    bookedSeats: 0,
    addToDelivery: false,
  });

  // Tumanlar (Backend bilan bir xil bo'lishi kerak)
  const districts = [
    { key: "Nukus", name: "Nukus" },
    { key: "Chimboy", name: "Chimboy" },
    { key: "Qongirot", name: "Qo'ng'irot" },
    { key: "Beruniy", name: "Beruniy" },
    { key: "Tortkol", name: "To'rtko'l" },
    { key: "Moynoq", name: "Mo'ynoq" },
    { key: "Xojayli", name: "Xo'jayli" },
    { key: "Shumanay", name: "Shumanay" },
    { key: "Qanlikol", name: "Qonliko'l" },
    { key: "Kegeyli", name: "Kegeyli" },
    { key: "Qoraozak", name: "Qorao'zak" },
    { key: "Taxtakopir", name: "Taxtako'pir" }
  ];

  // 1. Ilova ochilganda aktiv e'lonni tekshirish
  useEffect(() => {
    checkActiveOrder();
  }, []);

  const checkActiveOrder = async () => {
    setLoading(true);
    const savedId = localStorage.getItem("activeInterDistrictId");
    
    if (savedId) {
      try {
        // Serverdan e'lon holatini tekshiramiz
        const res = await api.post("/api/order", { action: "status", orderId: savedId });
        const order = res?.data?.order || res?.order;
        
        if (order && order.status !== 'completed' && order.status !== 'cancelled') {
          setActiveOrderId(savedId);
          setFormData({
            from: order.from_district || "Nukus",
            to: order.to_district || "Chimboy",
            time: order.scheduled_at ? dayjs(order.scheduled_at) : dayjs(),
            price: order.price || 0,
            seats: order.seats_total || 4,
            bookedSeats: (order.seats_total - order.seats_available) || 0,
            addToDelivery: order.is_delivery || false
          });
          setStep(3); // Aktiv sahifaga o'tkazish
        } else {
          // E'lon eskirgan bo'lsa tozalaymiz
          localStorage.removeItem("activeInterDistrictId");
          setStep(0);
        }
      } catch (e) {
        console.error("Order check failed", e);
      }
    }
    setLoading(false);
  };

  // 2. E'lon yaratish (Serverga yuborish)
  const handleSave = async () => {
    if (formData.from === formData.to) {
      return message.error("Qayerdan va Qayerga bir xil bo'lishi mumkin emas!");
    }

    setSubmitting(true);
    try {
      // Vaqtni to'g'irlash (Bugungi sana + tanlangan soat)
      const scheduledAt = dayjs();
      scheduledAt.set('hour', formData.time.hour());
      scheduledAt.set('minute', formData.time.minute());

      const payload = {
        action: "create",
        service_type: "inter_district",
        status: "searching", // Yoki 'active'
        from_district: formData.from,
        to_district: formData.to,
        price: formData.price,
        seats_total: formData.seats,
        seats_available: formData.seats, // Boshida hammasi bo'sh
        scheduled_at: scheduledAt.toISOString(),
        is_delivery: formData.addToDelivery,
        pickup_location: formData.from, // Oddiy text lokatsiya
        dropoff_location: formData.to
      };

      const res = await api.post("/api/order", payload);
      
      if (res.success || res.orderId) {
        const newId = res.orderId || res.data.orderId;
        localStorage.setItem("activeInterDistrictId", newId);
        setActiveOrderId(newId);
        setStep(3);
        message.success("E'lon yaratildi va yo'lovchilarga ko'rinmoqda!");
      } else {
        message.error("Xatolik yuz berdi. Qaytadan urining.");
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
      localStorage.removeItem("activeInterDistrictId");
      setActiveOrderId(null);
      setStep(0);
      message.warning("E'lon bekor qilindi");
    } catch (e) {
      message.error("Bekor qilishda xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  // Tugma bosilganda kichrayish effekti
  const btnTouchProps = {
    onMouseDown: (e) => e.currentTarget.style.transform = "scale(0.97)",
    onMouseUp: (e) => e.currentTarget.style.transform = "scale(1)",
    onTouchStart: (e) => e.currentTarget.style.transform = "scale(0.97)",
    onTouchEnd: (e) => e.currentTarget.style.transform = "scale(1)",
    style: { transition: "transform 0.1s" }
  };

  // --- STEP 1: TUMAN MARKAZI FORMASI ---
  const renderMarkazForm = () => (
    <div style={{ padding: "15px", background: "#f8f9fa", minHeight: "100vh" }}>
      <Space direction="vertical" size={20} style={{ width: "100%" }}>

        <Card bordered={false} style={{ borderRadius: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 15 }}>
             <div style={{ position: 'absolute', left: 8, top: 15, bottom: 35, width: 2, background: '#e0e0e0', zIndex: 0 }}></div>

             {/* Qayerdan */}
             <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#1890ff', border: '3px solid white', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }} />
                <div style={{ flex: 1 }}>
                   <Text type="secondary" style={{ fontSize: 12 }}>Qayerdan (Tuman)</Text>
                   <Select size="large" bordered={false} style={{ width: "100%", borderBottom: '1px solid #f0f0f0' }} value={formData.from} onChange={val => setFormData({...formData, from: val})}>
                     {districts.map(d => <Option key={d.key} value={d.name}>{d.name}</Option>)}
                   </Select>
                </div>
             </div>

             {/* Qayerga */}
             <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#52c41a', border: '3px solid white', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }} />
                <div style={{ flex: 1 }}>
                   <Text type="secondary" style={{ fontSize: 12 }}>Qayerga (Tuman)</Text>
                   <Select size="large" bordered={false} style={{ width: "100%" }} value={formData.to} onChange={val => setFormData({...formData, to: val})}>
                     {districts.map(d => <Option key={d.key} value={d.name}>{d.name}</Option>)}
                   </Select>
                </div>
             </div>
          </div>
        </Card>

        <Card style={{ borderRadius: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", border: 'none' }}>
          <Checkbox checked={formData.addToDelivery} onChange={e => setFormData({...formData, addToDelivery: e.target.checked})}>
            <Space><SendOutlined style={{ color: "#52c41a", fontSize: 18 }} /> <Text strong>Pochta / Yuk ham olaman</Text></Space>
          </Checkbox>
        </Card>

        <Row gutter={12}>
          <Col span={12}>
            <Card title={<Space><ClockCircleOutlined /> Ketish vaqti</Space>} size="small" style={{ borderRadius: 20, boxShadow: "0 4px 15px rgba(0,0,0,0.03)", border: 'none' }}>
              <TimePicker format="HH:mm" size="large" variant="borderless" style={{ width: "100%", fontWeight: 'bold' }} value={formData.time} onChange={(v) => setFormData({...formData, time: v})} allowClear={false} />
            </Card>
          </Col>
          <Col span={12}>
            <Card title={<Space><ShoppingOutlined /> Narxi (so'm)</Space>} size="small" style={{ borderRadius: 20, boxShadow: "0 4px 15px rgba(0,0,0,0.03)", border: 'none' }}>
              <InputNumber min={0} size="large" variant="borderless" style={{ width: "100%", fontWeight: 'bold' }} value={formData.price} onChange={val => setFormData({...formData, price: val})} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Card>
          </Col>
        </Row>

        <Card style={{ borderRadius: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", border: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <Text strong>Bo'sh joylar soni</Text>
             <div style={{ display: 'flex', alignItems: 'center', gap: 15, background: '#f5f5f5', padding: '5px 10px', borderRadius: 15 }}>
                <Button shape="circle" icon="-" onClick={() => setFormData({...formData, seats: Math.max(1, formData.seats - 1)})} />
                <Text strong style={{ fontSize: 20 }}>{formData.seats}</Text>
                <Button shape="circle" icon="+" onClick={() => setFormData({...formData, seats: formData.seats + 1})} />
             </div>
          </div>
        </Card>

        <Button 
          type="primary" block size="large" 
          onClick={() => setStep(2)} 
          {...btnTouchProps}
          style={{ height: 60, borderRadius: 18, background: "#1890ff", fontSize: 18, fontWeight: '800', boxShadow: '0 8px 20px rgba(24,144,255,0.4)', border: 'none', ...btnTouchProps.style }}
        >
          DAVOM ETISH
        </Button>
      </Space>
    </div>
  );

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#1890ff', borderRadius: 12 } }}>
      <div style={{ minHeight: "100vh", background: "#fff", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div style={{ padding: "15px" }}>
           <Button shape="circle" size="large" icon={<ArrowLeftOutlined />} onClick={() => {
             if (step === 3) onBack(); // Active bo'lsa orqaga (menu)
             else if (step === 0) onBack();
             else setStep(0);
           }} style={{ border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
        </div>

        {/* LOADING STATE */}
        {loading && step === 0 ? (
           <div style={{ padding: 20 }}>
              <Skeleton active paragraph={{ rows: 2 }} />
              <br />
              <Skeleton.Button active block style={{ height: 70, borderRadius: 20, marginBottom: 15 }} />
              <Skeleton.Button active block style={{ height: 70, borderRadius: 20 }} />
           </div>
        ) : (
          <>
            {step === 0 && (
              <div style={{ padding: "20px" }}>
                <Title level={2} style={{ marginBottom: 30, fontWeight: 900 }}>Tumanlar Aro</Title>
                <Space direction="vertical" size={20} style={{ width: "100%" }}>
                  <Button 
                    block size="large" 
                    onClick={() => setStep(1)} 
                    {...btnTouchProps}
                    style={{ height: 90, borderRadius: 24, textAlign: "left", fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0', ...btnTouchProps.style }}
                  >
                    <div>
                       <span style={{ display:'block', fontSize: 14, color: '#888' }}>Standard</span>
                       Markazdan - Markazga
                       <div style={{fontSize: 12, color: '#1890ff', marginTop: 4}}>Eng ommabop</div>
                    </div>
                    <CarOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                  </Button>

                  <Button 
                    block size="large" 
                    onClick={() => setStep(4)} 
                    {...btnTouchProps}
                    style={{ height: 90, borderRadius: 24, textAlign: "left", fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0', ...btnTouchProps.style }}
                  >
                    <div>
                       <span style={{ display:'block', fontSize: 14, color: '#888' }}>Premium</span>
                       Eshikdan - Eshikgacha
                       <div style={{fontSize: 12, color: '#faad14', marginTop: 4}}>Uyidan olib ketish</div>
                    </div>
                    <CompassOutlined style={{ fontSize: 32, color: '#faad14' }} />
                  </Button>
                </Space>
              </div>
            )}

            {step === 1 && renderMarkazForm()}

            {step === 2 && (
              <div style={{ padding: 25, paddingTop: 40 }}>
                <Title level={3} style={{textAlign:"center", marginBottom: 30, fontWeight: 800}}>Tasdiqlash</Title>
                <Card style={{ borderRadius: 30, boxShadow: '0 10px 30px rgba(0,0,0,0.08)', border: 'none', padding: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                     <Title level={4} style={{ margin: 0 }}>{formData.from}</Title>
                     <ArrowLeftOutlined style={{ transform: 'rotate(180deg)', color: '#ccc' }} />
                     <Title level={4} style={{ margin: 0 }}>{formData.to}</Title>
                  </div>
                  <Divider style={{ margin: "10px 0" }} />
                  <Row gutter={[16, 16]}>
                     <Col span={12}><Text type="secondary">Ketish vaqti</Text><div style={{fontWeight:'bold', fontSize: 16}}>{formData.time.format('HH:mm')}</div></Col>
                     <Col span={12}><Text type="secondary">Joylar soni</Text><div style={{fontWeight:'bold', fontSize: 16}}>{formData.seats} ta</div></Col>
                     <Col span={24}><Text type="secondary">Narxi (kishi boshiga)</Text><div style={{fontWeight:'bold', fontSize: 24, color: '#1890ff'}}>{formData.price.toLocaleString()} so'm</div></Col>
                  </Row>
                </Card>
                <Button 
                  block type="primary" size="large" 
                  loading={submitting}
                  {...btnTouchProps}
                  style={{ marginTop: 30, background: "black", height: 60, borderRadius: 18, fontWeight: 700, fontSize: 16, boxShadow: '0 10px 25px rgba(0,0,0,0.2)', ...btnTouchProps.style }} 
                  onClick={handleSave}
                >
                  E'LONNI JOYLASHTIRISH
                </Button>
              </div>
            )}

            {step === 3 && (
              <div style={{ padding: 25, height: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Card style={{ textAlign: "center", borderRadius: 32, boxShadow: "0 15px 40px rgba(24,144,255,0.15)", border: 'none' }}>
                  <div style={{ marginBottom: 20, background: '#e6f7ff', width: 100, height: 100, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                     <CheckCircleOutlined style={{fontSize: 50, color: "#1890ff"}} />
                  </div>
                  <Title level={3} style={{ fontWeight: 800 }}>E'lon Aktiv!</Title>
                  <Text type="secondary">Yo'lovchilar sizni ko'rishmoqda</Text>
                  
                  {formData.addToDelivery && <div style={{marginTop: 10}}><Tag color="green">Pochta qabul qilinadi</Tag></div>}

                  <Divider />
                  <Row justify="space-around">
                    <Col>
                      <Text type="secondary" style={{fontSize: 10}}>Qayerdan</Text>
                      <Title level={5} style={{margin:0}}>{formData.from}</Title>
                    </Col>
                    <Col><Text strong>→</Text></Col>
                    <Col>
                      <Text type="secondary" style={{fontSize: 10}}>Qayerga</Text>
                      <Title level={5} style={{margin:0}}>{formData.to}</Title>
                    </Col>
                  </Row>
                  <Divider />

                  <div style={{ textAlign: 'left', marginBottom: 5 }}><Text type="secondary">Band qilingan joylar:</Text></div>
                  <Progress percent={((formData.bookedSeats) / formData.seats) * 100} showInfo={false} strokeColor="#1890ff" trailColor="#f0f0f0" strokeWidth={12} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                     <Text strong>{formData.seats - formData.bookedSeats} ta bo'sh</Text>
                     <Text type="secondary">Jami: {formData.seats}</Text>
                  </div>
                </Card>

                <Space direction="vertical" size={15} style={{ width: "100%", marginTop: 40 }}>
                  <Button 
                    block type="primary" size="large" 
                    {...btnTouchProps}
                    style={{ background: "black", height: 60, borderRadius: 18, fontWeight: 700, ...btnTouchProps.style }} 
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
                    E'LONNI BEKOR QILISH
                  </Button>
                </Space>
              </div>
            )}

            {step === 4 && (
               <div style={{padding: 25, textAlign: 'center', paddingTop: 100}}>
                  <CompassOutlined style={{fontSize: 60, color: '#faad14', marginBottom: 20}} />
                  <Title level={3}>Eshikdan Eshikgacha</Title>
                  <Text type="secondary">Bu xizmat tez orada ishga tushadi. Hozircha faqat markazdan-markazga qatnov mavjud.</Text>
                  <Button size="large" type="primary" style={{ marginTop: 40, borderRadius: 15 }} onClick={() => setStep(0)}>Ortga qaytish</Button>
               </div>
            )}
          </>
        )}
      </div>
    </ConfigProvider>
  );
}