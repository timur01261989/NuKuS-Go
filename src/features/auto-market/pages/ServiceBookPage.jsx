/**
 * ServiceBookPage.jsx - "Avto-Daftar"
 * 100% TO'LIQ VARIANT - HECH QANDAY QISQARTIRMASIZ.
 * Funksiyalar:
 * 1. Xarajatlar tarixi va tahlili (Moy, Zapchast, Jarima, Sug'urta va h.k.)
 * 2. Hujjatlar nazorati (Sug'urta va Texosmotr tugash vaqti)
 * 3. Smart Eslatmalar (Moy almashtirish kilometri, hujjat muddati)
 */
import React, { useState, useMemo } from "react";
import { 
  Button, 
  Card, 
  Tag, 
  Row, 
  Col, 
  Statistic, 
  Timeline, 
  Empty, 
  Modal, 
  Form, 
  Input, 
  InputNumber, 
  DatePicker, 
  Select, 
  Divider, 
  Alert, 
  Progress,
  message
} from "antd";
import { 
  ArrowLeftOutlined, 
  PlusOutlined, 
  ToolOutlined, 
  SafetyCertificateOutlined, 
  DashboardOutlined, 
  DollarOutlined, 
  HistoryOutlined, 
  FileDoneOutlined,
  AlertOutlined,
  BgColorsOutlined,
  CarOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

// Xizmat turlari va ularning ikonkalari/ranglari
const SERVICE_TYPES = [
  { id: "oil", label: "Moy almashtirish", color: "#f59e0b", icon: <BgColorsOutlined /> },
  { id: "repair", label: "Ta'mirlash / Zapchast", color: "#3b82f6", icon: <ToolOutlined /> },
  { id: "insurance", label: "Sug'urta", color: "#10b981", icon: <SafetyCertificateOutlined /> },
  { id: "texosmotr", label: "Texnik ko'rik", color: "#8b5cf6", icon: <FileDoneOutlined /> },
  { id: "fine", label: "Jarima", color: "#ef4444", icon: <AlertOutlined /> },
  { id: "other", label: "Boshqa xarajat", color: "#64748b", icon: <DollarOutlined /> },
];

export default function ServiceBookPage() {
  const nav = useNavigate();
  const [form] = Form.useForm();
  const [docForm] = Form.useForm();
  
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  // MOCK DATA: Real loyihada bu Context yoki API dan keladi
  const [carData, setCarData] = useState({
    brand: "Chevrolet",
    model: "Cobalt",
    year: 2023,
    current_km: 45000,
    // Hujjatlar nazorati:
    insurance_expiry: "2026-05-15",
    tex_expiry: "2026-03-20",
    last_oil_km: 42000,
    oil_interval: 8000,
  });

  const [records, setRecords] = useState([
    { id: 1, type: "oil", amount: 450000, date: "2026-01-10", note: "Shell Helix 5W-30 + Filtrlar", km: 42000 },
    { id: 2, type: "repair", amount: 1200000, date: "2025-11-20", note: "Tormoz kolodkalari va amortizator", km: 38500 },
    { id: 3, type: "insurance", amount: 650000, date: "2025-05-15", note: "Yillik majburiy sug'urta", km: 30000 },
  ]);

  // --- HISOB-KITOBLAR VA LOGIKA ---

  const formatMoney = (sum) => sum.toLocaleString() + " UZS";

  const totalSpent = useMemo(() => {
    return records.reduce((acc, curr) => acc + curr.amount, 0);
  }, [records]);

  // Hujjatlar muddati
  const daysToInsurance = dayjs(carData.insurance_expiry).diff(dayjs(), 'day');
  const daysToTex = dayjs(carData.tex_expiry).diff(dayjs(), 'day');
  
  // Moy nazorati
  const kmSinceOil = carData.current_km - carData.last_oil_km;
  const kmLeftForOil = carData.oil_interval - kmSinceOil;
  const oilProgress = Math.min(100, (kmSinceOil / carData.oil_interval) * 100);

  // --- HANDLERLAR ---

  const handleAddRecord = (values) => {
    const newRecord = {
      id: Date.now(),
      type: values.type,
      amount: values.amount,
      date: values.date ? values.date.format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
      note: values.note,
      km: values.km || carData.current_km
    };
    
    setRecords([newRecord, ...records].sort((a, b) => new Date(b.date) - new Date(a.date)));
    
    // Agar moy almashtirilgan bo'lsa, mashinaning km sini yangilash
    if (values.type === "oil") {
      setCarData(prev => ({ ...prev, last_oil_km: values.km || prev.current_km, current_km: values.km || prev.current_km }));
    }

    setIsRecordModalOpen(false);
    form.resetFields();
    message.success("Yangi xarajat qo'shildi!");
  };

  const handleUpdateDocs = (values) => {
    setCarData(prev => ({
      ...prev,
      insurance_expiry: values.insurance_expiry ? values.insurance_expiry.format("YYYY-MM-DD") : prev.insurance_expiry,
      tex_expiry: values.tex_expiry ? values.tex_expiry.format("YYYY-MM-DD") : prev.tex_expiry,
      current_km: values.current_km || prev.current_km
    }));
    setIsDocModalOpen(false);
    message.success("Hujjatlar va KM yangilandi!");
  };

  return (
    <div style={{ padding: "16px 16px 100px", background: "#f8fafc", minHeight: "100vh" }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Button icon={<ArrowLeftOutlined />} shape="circle" onClick={() => nav(-1)} />
          <div>
            <h1 style={{ margin: 0, fontWeight: 950, fontSize: 22 }}>Avto-Daftar</h1>
            <span style={{ fontSize: 12, color: "#64748b" }}>{carData.brand} {carData.model} ({carData.year})</span>
          </div>
        </div>
        <Button 
          type="primary" 
          shape="circle" 
          icon={<PlusOutlined />} 
          size="large"
          style={{ background: "#0f172a", border: "none" }}
          onClick={() => setIsRecordModalOpen(true)}
        />
      </div>

      {/* UMUMIY XARAJAT VA ASOSIY STATISTIKA */}
      <Row gutter={[12, 12]}>
        <Col span={24}>
          <Card 
            style={{ borderRadius: 24, border: "none", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#fff" }}
            bodyStyle={{ padding: 20 }}
          >
            <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 4 }}>Umumiy Xarajatlar</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#fff" }}>
              {formatMoney(totalSpent)}
            </div>
            <Divider style={{ borderColor: "rgba(255,255,255,0.1)", margin: "16px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <DashboardOutlined style={{ color: "#3b82f6" }} />
                <span style={{ fontSize: 13, color: "#cbd5e1" }}>Yurgan yo'li: <b>{carData.current_km.toLocaleString()} km</b></span>
              </div>
              <Button size="small" type="primary" ghost style={{ borderRadius: 8 }} onClick={() => setIsDocModalOpen(true)}>
                Yangilash
              </Button>
            </div>
          </Card>
        </Col>

        {/* HUJJATLAR NAZORATI (Sobiq Garajdagi funksiyalar) */}
        <Col span={12}>
          <Card 
            style={{ borderRadius: 24, border: "none", height: "100%", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }} 
            bodyStyle={{ padding: 16 }}
          >
            <div style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <SafetyCertificateOutlined style={{ color: daysToInsurance < 10 ? "#ef4444" : "#10b981" }} />
              Sug'urta
            </div>
            <div style={{ fontWeight: 800, fontSize: 16, color: daysToInsurance < 10 ? "#ef4444" : "#0f172a" }}>
              {daysToInsurance < 0 ? "Muddati o'tgan!" : `${daysToInsurance} kun qoldi`}
            </div>
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>Tugaydi: {dayjs(carData.insurance_expiry).format("DD.MM.YYYY")}</div>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card 
            style={{ borderRadius: 24, border: "none", height: "100%", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }} 
            bodyStyle={{ padding: 16 }}
          >
            <div style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <FileDoneOutlined style={{ color: daysToTex < 10 ? "#ef4444" : "#8b5cf6" }} />
              Texnik ko'rik
            </div>
            <div style={{ fontWeight: 800, fontSize: 16, color: daysToTex < 10 ? "#ef4444" : "#0f172a" }}>
              {daysToTex < 0 ? "Muddati o'tgan!" : `${daysToTex} kun qoldi`}
            </div>
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>Tugaydi: {dayjs(carData.tex_expiry).format("DD.MM.YYYY")}</div>
          </Card>
        </Col>

        {/* MOY ALMASHTIRISH NAZORATI */}
        <Col span={24}>
          <Card style={{ borderRadius: 24, border: "none", boxShadow: "0 4px 15px rgba(0,0,0,0.03)" }} bodyStyle={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                <BgColorsOutlined style={{ color: "#f59e0b" }} /> Moy almashtirish (Dvigatel)
              </div>
              <Tag color={kmLeftForOil < 1000 ? "error" : "success"} style={{ borderRadius: 8, margin: 0 }}>
                {kmLeftForOil > 0 ? `${kmLeftForOil} km qoldi` : "Vaqti keldi"}
              </Tag>
            </div>
            <Progress 
              percent={oilProgress} 
              showInfo={false} 
              strokeColor={oilProgress > 90 ? "#ef4444" : "#f59e0b"} 
              trailColor="#f1f5f9"
              strokeWidth={10}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", marginTop: 8 }}>
              <span>Oxirgi: {carData.last_oil_km.toLocaleString()} km</span>
              <span>Kechikish: {carData.oil_interval.toLocaleString()} km dan</span>
            </div>
          </Card>
        </Col>
      </Row>

      {/* SMART ESLATMALAR (Agar muammo bo'lsa chiqadi) */}
      {(daysToInsurance < 10 || daysToTex < 10 || kmLeftForOil < 500) && (
        <Alert
          message="E'tibor bering!"
          description={
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12 }}>
              {daysToInsurance < 10 && <li>Sug'urta muddati tugamoqda!</li>}
              {daysToTex < 10 && <li>Texosmotr muddati tugamoqda!</li>}
              {kmLeftForOil < 500 && <li>Moy almashtirish vaqti yaqinlashdi!</li>}
            </ul>
          }
          type="warning"
          showIcon
          style={{ marginTop: 16, borderRadius: 16, border: "1px solid #fcd34d" }}
        />
      )}

      {/* XARAJATLAR TARIXI (TIMELINE) */}
      <div style={{ marginTop: 24 }}>
        <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <HistoryOutlined /> Servis Tarixi
        </h3>
        
        {records.length === 0 ? (
          <Empty description="Hali xarajatlar kiritilmagan" style={{ background: "#fff", padding: 30, borderRadius: 24 }} />
        ) : (
          <Card style={{ borderRadius: 24, border: "none", boxShadow: "0 4px 15px rgba(0,0,0,0.02)" }} bodyStyle={{ padding: "20px 20px 0" }}>
            <Timeline>
              {records.map((rec) => {
                const typeObj = SERVICE_TYPES.find(t => t.id === rec.type);
                return (
                  <Timeline.Item 
                    key={rec.id} 
                    color={typeObj?.color || "blue"}
                    dot={<div style={{ background: typeObj?.color, width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12 }}>{typeObj?.icon}</div>}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <div style={{ fontWeight: 800, fontSize: 15 }}>{typeObj?.label || "Boshqa"}</div>
                      <div style={{ fontWeight: 900, color: typeObj?.color, fontSize: 14 }}>{formatMoney(rec.amount)}</div>
                    </div>
                    <div style={{ fontSize: 12, color: "#475569", marginBottom: 4 }}>{rec.note}</div>
                    <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#94a3b8" }}>
                      <span>🗓 {dayjs(rec.date).format("DD.MM.YYYY")}</span>
                      <span>🚗 {rec.km?.toLocaleString()} km</span>
                    </div>
                  </Timeline.Item>
                );
              })}
            </Timeline>
          </Card>
        )}
      </div>

      {/* 1. XARAJAT QO'SHISH MODALI */}
      <Modal
        title={<div style={{ fontWeight: 900, fontSize: 18 }}>Xarajat yoki Servis qo'shish</div>}
        open={isRecordModalOpen}
        onCancel={() => setIsRecordModalOpen(false)}
        onOk={() => form.submit()}
        okText="Saqlash"
        cancelText="Bekor qilish"
        centered
        borderRadius={24}
      >
        <Form form={form} layout="vertical" onFinish={handleAddRecord} style={{ marginTop: 16 }}>
          <Form.Item name="type" label="Xizmat turi" rules={[{ required: true, message: "Turini tanlang" }]}>
            <Select 
              size="large"
              placeholder="Nima qilinganini tanlang" 
              options={SERVICE_TYPES.map(t => ({ value: t.id, label: t.label }))}
            />
          </Form.Item>
          
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="amount" label="Narxi (UZS)" rules={[{ required: true, message: "Narxni kiriting" }]}>
                <InputNumber style={{ width: "100%", borderRadius: 10 }} size="large" formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="date" label="Sanasi">
                <DatePicker style={{ width: "100%", borderRadius: 10 }} size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="km" label="O'sha vaqtdagi probeg (KM)">
            <InputNumber style={{ width: "100%", borderRadius: 10 }} size="large" placeholder={carData.current_km.toString()} />
          </Form.Item>

          <Form.Item name="note" label="Eslatma (Nimalar qilindi?)">
            <Input.TextArea rows={3} style={{ borderRadius: 10 }} placeholder="Masalan: Moy filtr ham almashtirildi..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* 2. HUJJATLARNI YANGILASH MODALI */}
      <Modal
        title={<div style={{ fontWeight: 900, fontSize: 18 }}><SafetyCertificateOutlined /> Hujjatlar va KM yangilash</div>}
        open={isDocModalOpen}
        onCancel={() => setIsDocModalOpen(false)}
        onOk={() => docForm.submit()}
        okText="Yangilash"
        cancelText="Yopish"
        centered
        borderRadius={24}
      >
        <Form 
          form={docForm} 
          layout="vertical" 
          onFinish={handleUpdateDocs} 
          initialValues={{ 
            current_km: carData.current_km,
            insurance_expiry: dayjs(carData.insurance_expiry),
            tex_expiry: dayjs(carData.tex_expiry)
          }}
          style={{ marginTop: 16 }}
        >
          <Form.Item name="current_km" label="Hozirgi probeg (KM)">
            <InputNumber style={{ width: "100%", borderRadius: 10 }} size="large" />
          </Form.Item>
          
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="insurance_expiry" label="Sug'urta tugash sanasi">
                <DatePicker style={{ width: "100%", borderRadius: 10 }} size="large" format="DD.MM.YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tex_expiry" label="Tex. ko'rik tugash sanasi">
                <DatePicker style={{ width: "100%", borderRadius: 10 }} size="large" format="DD.MM.YYYY" />
              </Form.Item>
            </Col>
          </Row>
          <Alert message="Sana va kilometrni to'g'ri kiriting, shunga qarab eslatmalar ishlaydi." type="info" showIcon />
        </Form>
      </Modal>

    </div>
  );
}