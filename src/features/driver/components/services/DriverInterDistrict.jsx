import React, { useState, useEffect } from "react";
import { 
  Card, Button, Typography, Row, Col, Input, 
  TimePicker, InputNumber, Space, Switch, message, 
  ConfigProvider, Divider, Alert, Select, Progress, Checkbox, Tag, Skeleton
} from "antd";
import { 
  ArrowLeftOutlined, ClockCircleOutlined, UserOutlined, 
  CheckCircleOutlined, CompassOutlined, ShoppingOutlined,
  SendOutlined, DeleteOutlined, EnvironmentFilled
} from "@ant-design/icons";
import dayjs from "dayjs";
import { translations } from "../../../pages/translations";
import { supabase } from "../../../lib/supabase"; 

const { Title, Text } = Typography;
const { Option } = Select;

export default function DriverInterDistrict({ onBack }) {
  const savedLang = localStorage.getItem("appLang") || "uz_lotin";
  const t = translations[savedLang] || translations["uz_lotin"];

  // E'lon holatini localStorage'dan tekshirish
  const savedAd = JSON.parse(localStorage.getItem("activeInterDistrictAd"));
  const [step, setStep] = useState(savedAd ? 3 : 0);
  const [loading, setLoading] = useState(true); // Skeleton uchun

  const [formData, setFormData] = useState(savedAd || {
    from: t.nukus,
    to: t.chimboy,
    time: "18:00",
    price: 20000,
    seats: 4,
    bookedSeats: 0,
    isPackageAllowed: false,
    addToDelivery: false,
    gpsLocation: null
  });

  // Dastlabki yuklanish effekti
  useEffect(() => {
    setTimeout(() => setLoading(false), 600);
  }, []);

  // Tumanlar ro'yxati
  const districts = [
    { key: "nukus", name: t.nukus },
    { key: "chimboy", name: t.chimboy },
    { key: "qongirot", name: t.qongirot },
    { key: "beruniy", name: t.beruniy },
    { key: "tortkol", name: t.tortkol },
    { key: "moynoq", name: t.moynoq },
    { key: "xojayli", name: t.xojayli },
    { key: "shumanay", name: t.shumanay },
    { key: "qanlikol", name: t.qanlikol },
    { key: "kegeyli", name: t.kegeyli },
    { key: "qoraozak", name: t.qoraozak },
    { key: "taxtakopir", name: t.taxtakopir }
  ];

  const handleSave = () => {
    localStorage.setItem("activeInterDistrictAd", JSON.stringify(formData));
    setStep(3);
    message.success(t.adActive);
  };

  const handleCancelAd = () => {
    localStorage.removeItem("activeInterDistrictAd");
    setFormData({ ...formData, bookedSeats: 0, addToDelivery: false });
    setStep(0);
    message.warning(t.cancelAd);
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
             {/* Vizual marshrut chizig'i */}
             <div style={{ position: 'absolute', left: 8, top: 15, bottom: 35, width: 2, background: '#e0e0e0', zIndex: 0 }}></div>

             {/* Qayerdan */}
             <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#1890ff', border: '3px solid white', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }} />
                <div style={{ flex: 1 }}>
                   <Text type="secondary" style={{ fontSize: 12 }}>{t.qayerdan}</Text>
                   <Select size="large" bordered={false} style={{ width: "100%", borderBottom: '1px solid #f0f0f0' }} value={formData.from} onChange={val => setFormData({...formData, from: val})}>
                     {districts.map(d => <Option key={d.key} value={d.name}>{d.name}</Option>)}
                   </Select>
                </div>
             </div>

             {/* Qayerga */}
             <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#52c41a', border: '3px solid white', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }} />
                <div style={{ flex: 1 }}>
                   <Text type="secondary" style={{ fontSize: 12 }}>{t.qayerga}</Text>
                   <Select size="large" bordered={false} style={{ width: "100%" }} value={formData.to} onChange={val => setFormData({...formData, to: val})}>
                     {districts.map(d => <Option key={d.key} value={d.name}>{d.name}</Option>)}
                   </Select>
                </div>
             </div>
          </div>
        </Card>

        <Card style={{ borderRadius: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", border: 'none' }}>
          <Checkbox checked={formData.addToDelivery} onChange={e => setFormData({...formData, addToDelivery: e.target.checked})}>
            <Space><SendOutlined style={{ color: "#52c41a", fontSize: 18 }} /> <Text strong>{t.addToDelivery}</Text></Space>
          </Checkbox>
        </Card>

        <Row gutter={12}>
          <Col span={12}>
            <Card title={<Space><ClockCircleOutlined /> {t.departureTime}</Space>} size="small" style={{ borderRadius: 20, boxShadow: "0 4px 15px rgba(0,0,0,0.03)", border: 'none' }}>
              <TimePicker format="HH:mm" size="large" variant="borderless" style={{ width: "100%", fontWeight: 'bold' }} value={dayjs(formData.time, 'HH:mm')} onChange={(v, s) => setFormData({...formData, time: s})} />
            </Card>
          </Col>
          <Col span={12}>
            <Card title={<Space><ShoppingOutlined /> {t.summasi}</Space>} size="small" style={{ borderRadius: 20, boxShadow: "0 4px 15px rgba(0,0,0,0.03)", border: 'none' }}>
              <InputNumber min={0} size="large" variant="borderless" style={{ width: "100%", fontWeight: 'bold' }} value={formData.price} onChange={val => setFormData({...formData, price: val})} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Card>
          </Col>
        </Row>

        <Card style={{ borderRadius: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.05)", border: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <Text strong>{t.availableSeats}</Text>
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
          {t.create.toUpperCase()}
        </Button>
      </Space>
    </div>
  );

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#1890ff', borderRadius: 12 } }}>
      <div style={{ minHeight: "100vh", background: "#fff", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div style={{ padding: "15px" }}>
           <Button shape="circle" size="large" icon={<ArrowLeftOutlined />} onClick={() => {
             if (step === 3) onBack(); 
             else if (step === 0) onBack();
             else setStep(0);
           }} style={{ border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
        </div>

        {/* LOADING SKELETON */}
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
                <Title level={2} style={{ marginBottom: 30, fontWeight: 900 }}>Nukus Go</Title>
                <Space direction="vertical" size={20} style={{ width: "100%" }}>
                  <Button 
                    block size="large" 
                    onClick={() => setStep(1)} 
                    {...btnTouchProps}
                    style={{ height: 80, borderRadius: 24, textAlign: "left", fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0', ...btnTouchProps.style }}
                  >
                    <div>
                       <span style={{ display:'block', fontSize: 14, color: '#888' }}>Standard</span>
                       {t.toDistrictCenter}
                    </div>
                    <EnvironmentFilled style={{ fontSize: 24, color: '#1890ff' }} />
                  </Button>

                  <Button 
                    block size="large" 
                    onClick={() => setStep(4)} 
                    {...btnTouchProps}
                    style={{ height: 80, borderRadius: 24, textAlign: "left", fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0', ...btnTouchProps.style }}
                  >
                    <div>
                       <span style={{ display:'block', fontSize: 14, color: '#888' }}>Premium</span>
                       {t.doorToDoor}
                    </div>
                    <CompassOutlined style={{ fontSize: 24, color: '#faad14' }} />
                  </Button>
                </Space>
              </div>
            )}

            {step === 1 && renderMarkazForm()}

            {step === 2 && (
              <div style={{ padding: 25, paddingTop: 40 }}>
                <Title level={3} style={{textAlign:"center", marginBottom: 30, fontWeight: 800}}>{t.confirmDetails}</Title>
                <Card style={{ borderRadius: 30, boxShadow: '0 10px 30px rgba(0,0,0,0.08)', border: 'none', padding: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                     <Title level={4} style={{ margin: 0 }}>{formData.from}</Title>
                     <ArrowLeftOutlined style={{ transform: 'rotate(180deg)', color: '#ccc' }} />
                     <Title level={4} style={{ margin: 0 }}>{formData.to}</Title>
                  </div>
                  <Divider style={{ margin: "10px 0" }} />
                  <Row gutter={[16, 16]}>
                     <Col span={12}><Text type="secondary">{t.departureTime}</Text><div style={{fontWeight:'bold', fontSize: 16}}>{formData.time}</div></Col>
                     <Col span={12}><Text type="secondary">{t.availableSeats}</Text><div style={{fontWeight:'bold', fontSize: 16}}>{formData.seats} ta</div></Col>
                     <Col span={24}><Text type="secondary">{t.summasi}</Text><div style={{fontWeight:'bold', fontSize: 24, color: '#1890ff'}}>{formData.price} {t.som}</div></Col>
                  </Row>
                </Card>
                <Button 
                  block type="primary" size="large" 
                  {...btnTouchProps}
                  style={{ marginTop: 30, background: "black", height: 60, borderRadius: 18, fontWeight: 700, fontSize: 16, boxShadow: '0 10px 25px rgba(0,0,0,0.2)', ...btnTouchProps.style }} 
                  onClick={handleSave}
                >
                  {t.save.toUpperCase()}
                </Button>
              </div>
            )}

            {step === 3 && (
              <div style={{ padding: 25, height: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Card style={{ textAlign: "center", borderRadius: 32, boxShadow: "0 15px 40px rgba(24,144,255,0.15)", border: 'none' }}>
                  <div style={{ marginBottom: 20, background: '#e6f7ff', width: 100, height: 100, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                     <CheckCircleOutlined style={{fontSize: 50, color: "#1890ff"}} />
                  </div>
                  <Title level={3} style={{ fontWeight: 800 }}>{t.adActive}</Title>
                  {formData.addToDelivery && <Tag color="green" style={{marginBottom: 15, borderRadius: 10, padding: '5px 10px'}}>{t.deliveryActive}</Tag>}

                  <Divider />
                  <Row justify="space-around">
                    <Col>
                      <Text type="secondary" style={{fontSize: 10}}>{t.qayerdan}</Text>
                      <Title level={5} style={{margin:0}}>{formData.from}</Title>
                    </Col>
                    <Col><Text strong>→</Text></Col>
                    <Col>
                      <Text type="secondary" style={{fontSize: 10}}>{t.qayerga}</Text>
                      <Title level={5} style={{margin:0}}>{formData.to}</Title>
                    </Col>
                  </Row>
                  <Divider />

                  <div style={{ textAlign: 'left', marginBottom: 5 }}><Text type="secondary">{t.bookedSeatsText}</Text></div>
                  <Progress percent={((formData.seats - formData.bookedSeats) / formData.seats) * 100} showInfo={false} strokeColor="#1890ff" trailColor="#f0f0f0" strokeWidth={12} />
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
                    {t.backToMenu}
                  </Button>
                  <Button 
                    block danger ghost size="large" icon={<DeleteOutlined />} 
                    {...btnTouchProps}
                    style={{ height: 60, borderRadius: 18, border: '2px solid #ff4d4f', fontWeight: 600, ...btnTouchProps.style }} 
                    onClick={handleCancelAd}
                  >
                    {t.cancelAd.toUpperCase()}
                  </Button>
                </Space>
              </div>
            )}

            {step === 4 && (
               <div style={{padding: 25, textAlign: 'center'}}>
                  <Title level={4}>Manzildan Manzilga</Title>
                  <Text type="secondary">Tez kunda...</Text>
                  <Button style={{ marginTop: 20 }} onClick={() => setStep(0)}>Ortga</Button>
               </div>
            )}
          </>
        )}
      </div>
    </ConfigProvider>
  );
}