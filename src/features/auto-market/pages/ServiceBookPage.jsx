/**
 * ServiceBookPage.jsx
 * "Rasxod Daftar" — barcha mashinalar va ularning xizmat tarixi.
 * YANGI: Moy almashtirish monitoringi va AI Eslatmalar qo'shildi.
 * 100% TO'LIQ VARIANT.
 */
import React, { useEffect, useState } from "react";
import { 
  Button, 
  Empty, 
  Modal, 
  Input, 
  Select, 
  InputNumber, 
  DatePicker, 
  message, 
  Spin, 
  Card,
  Row,
  Col,
  Progress,
  Alert
} from "antd";
import { 
  ArrowLeftOutlined, 
  PlusOutlined, 
  SafetyCertificateOutlined, 
  FileDoneOutlined,
  BulbOutlined,
  DashboardOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getServiceBooks, createServiceBook, addServiceRecord } from "../services/marketBackend";
import { BRANDS, SERVICE_TYPES } from "../services/staticData";
import ServiceBookWidget from "../components/Details/ServiceBookWidget";
import dayjs from "dayjs";
import { useAutoMarketI18n } from "../utils/useAutoMarketI18n";

export default function ServiceBookPage() {
  const { am } = useAutoMarketI18n();
  const nav = useNavigate();
  
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [addBookOpen, setAddBookOpen] = useState(false);
  const [addRecOpen, setAddRecOpen] = useState(false);
  const [activeBook, setActiveBook] = useState(null);

  // Yangi mashina formasi
  const [newBook, setNewBook] = useState({
    car_brand: "", 
    car_model: "", 
    car_year: "", 
    car_plate: "",
    current_mileage: 0, 
    oil_change_km: 7000, // Standart 7000 km
    last_oil_change: 0,
    insurance_expiry: "", 
    tex_expiry: ""
  });

  // Yangi servis yozuvi formasi
  const [newRec, setNewRec] = useState({
    service_type: "",
    title: "",
    mileage_at: "",
    cost: "",
    next_due_km: ""
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await getServiceBooks();
      setBooks(data || []);
    } catch (error) {
      console.error("Daftarlarni yuklashda xato:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAddBook = async () => {
    if (!newBook.car_brand || !newBook.car_model) {
      return message.error("Marka va modelni kiriting");
    }
    setLoading(true);
    try {
      await createServiceBook(newBook);
      message.success("Yangi daftar ochildi");
      setAddBookOpen(false);
      setNewBook({
        car_brand: "", car_model: "", car_year: "", car_plate: "",
        current_mileage: 0, oil_change_km: 7000, last_oil_change: 0,
        insurance_expiry: "", tex_expiry: ""
      });
      load();
    } catch (e) {
      message.error("Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = async () => {
    if (!activeBook || !newRec.service_type || !newRec.cost) {
      return message.error("Xizmat turi va narxini kiriting");
    }
    setLoading(true);
    try {
      await addServiceRecord(activeBook.id, newRec);
      message.success("Xarajat qo'shildi");
      setAddRecOpen(false);
      setNewRec({ service_type: "", title: "", mileage_at: "", cost: "", next_due_km: "" });
      load();
    } catch (e) {
      message.error("Xarajat qo'shishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  // AI Eslatmalarni generatsiya qilish funksiyasi
  const getAiAlerts = (book) => {
    const alerts = [];
    const today = dayjs();
    
    // Sug'urta tekshiruvi
    if (book.insurance_expiry) {
      const diff = dayjs(book.insurance_expiry).diff(today, 'day');
      if (diff < 10 && diff > 0) alerts.push(`Sug'urta muddati tugashiga ${diff} kun qoldi!`);
      else if (diff <= 0) alerts.push("Sug'urta muddati o'tib ketgan!");
    }

    // Moy almashtirish tekshiruvi
    const drivenSinceOil = (book.current_mileage || 0) - (book.last_oil_change || 0);
    const oilLimit = book.oil_change_km || 7000;
    if (drivenSinceOil >= oilLimit - 500) {
      alerts.push("Tez orada dvigatel moyini almashtirish kerak!");
    }

    return alerts;
  };

  return (
    <div style={{ padding: 16, paddingBottom: 100, background: "#f8fafc", minHeight: "100vh" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Button icon={<ArrowLeftOutlined />} shape="circle" onClick={() => nav(-1)} />
          <h1 style={{ margin: 0, fontWeight: 900, fontSize: 20 }}>Rasxod Daftar</h1>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          style={{ borderRadius: 12, background: "#0f172a", border: "none" }}
          onClick={() => setAddBookOpen(true)}
        >
          Mashina qo'shish
        </Button>
      </div>

      {loading && books.length === 0 ? (
        <div style={{ textAlign: "center", marginTop: 50 }}><Spin size="large" /></div>
      ) : books.length === 0 ? (
        <Empty description="Hali daftar ochilmagan" style={{ marginTop: 50 }} />
      ) : (
        <div style={{ display: "grid", gap: 20 }}>
          {books.map(book => {
            const aiAlerts = getAiAlerts(book);
            const drivenSinceOil = (book.current_mileage || 0) - (book.last_oil_change || 0);
            const oilLimit = book.oil_change_km || 7000;
            const oilPercent = Math.min(Math.round((drivenSinceOil / oilLimit) * 100), 100);

            return (
              <Card 
                key={book.id} 
                style={{ borderRadius: 20, border: "none", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}
                bodyStyle={{ padding: 20 }}
              >
                {/* 1. MASHINA VA PROBEG */}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <h3 style={{ margin: 0, fontWeight: 900, fontSize: 19 }}>
                      {book.car_brand} {book.car_model}
                    </h3>
                    <Tag color="blue" style={{ marginTop: 4, borderRadius: 6 }}>{book.car_plate || "Raqamsiz"}</Tag>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, color: "#64748b" }}>Umumiy masofa</div>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{book.current_mileage?.toLocaleString()} km</div>
                  </div>
                </div>

                {/* 2. MOY ALMASHTIRISH MONITORINGI */}
                <div style={{ background: "#f1f5f9", padding: 15, borderRadius: 16, marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                    <span style={{ fontWeight: 700 }}>Moy almashtirish holati</span>
                    <span>{drivenSinceOil} / {oilLimit} km</span>
                  </div>
                  <Progress 
                    percent={oilPercent} 
                    status={oilPercent > 90 ? "exception" : "active"} 
                    strokeColor={oilPercent > 90 ? "#ef4444" : "#22c55e"}
                    showInfo={false}
                  />
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>
                    Oxirgi marta: {book.last_oil_change} km da almashtirilgan
                  </div>
                </div>

                {/* 3. HUJJATLAR VA AI ESLATMALAR */}
                <Row gutter={10} style={{ marginBottom: 16 }}>
                  <Col span={12}>
                    <div style={{ border: "1px solid #e2e8f0", padding: 10, borderRadius: 12 }}>
                      <div style={{ fontSize: 11, color: "#64748b" }}><SafetyCertificateOutlined /> Sug'urta</div>
                      <div style={{ fontWeight: 700 }}>{book.insurance_expiry ? dayjs(book.insurance_expiry).format("DD.MM.YYYY") : "---"}</div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ border: "1px solid #e2e8f0", padding: 10, borderRadius: 12 }}>
                      <div style={{ fontSize: 11, color: "#64748b" }}><FileDoneOutlined /> Tex. ko'rik</div>
                      <div style={{ fontWeight: 700 }}>{book.tex_expiry ? dayjs(book.tex_expiry).format("DD.MM.YYYY") : "---"}</div>
                    </div>
                  </Col>
                </Row>

                {aiAlerts.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    {aiAlerts.map((msg, i) => (
                      <Alert 
                        key={i}
                        message={msg} 
                        type="warning" 
                        showIcon 
                        icon={<BulbOutlined />}
                        style={{ borderRadius: 10, marginBottom: 6, fontSize: 12 }} 
                      />
                    ))}
                  </div>
                )}

                {/* 4. XARAJATLAR WIDGETI */}
                <ServiceBookWidget book={book} />

                <Button 
                  type="primary" 
                  block 
                  icon={<PlusOutlined />}
                  style={{ marginTop: 16, borderRadius: 12, height: 40, background: "#0f172a" }}
                  onClick={() => { setActiveBook(book); setAddRecOpen(true); }}
                >
                  Xarajat qo'shish
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* MODAL: MASHINA QO'SHISH */}
      <Modal 
        title="Yangi Mashina qo'shish"
        open={addBookOpen} 
        onOk={handleAddBook} 
        onCancel={() => setAddBookOpen(false)}
        centered
      >
        <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
          <Select 
            placeholder="Marka"
            onChange={v => setNewBook(p => ({...p, car_brand: v}))}
            options={BRANDS.map(b => ({ value: b.name, label: b.name }))} 
            style={{ width: "100%" }} 
          />
          <Input placeholder="Model" onChange={e => setNewBook(p => ({...p, car_model: e.target.value}))} />
          <Row gutter={8}>
            <Col span={12}><Input placeholder="Yili" onChange={e => setNewBook(p => ({...p, car_year: e.target.value}))} /></Col>
            <Col span={12}><Input placeholder="Raqami" onChange={e => setNewBook(p => ({...p, car_plate: e.target.value}))} /></Col>
          </Row>
          <div style={{ border: "1px solid #f1f5f9", padding: 10, borderRadius: 10 }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 5 }}>Moy almashtirish oralig'i (km)</div>
            <InputNumber 
              defaultValue={7000} 
              style={{ width: "100%" }} 
              onChange={v => setNewBook(p => ({...p, oil_change_km: v}))} 
            />
          </div>
          <Row gutter={8}>
            <Col span={12}>
              <div style={{ fontSize: 11 }}>Sug'urta muddati</div>
              <DatePicker style={{ width: "100%" }} onChange={(_, s) => setNewBook(p => ({...p, insurance_expiry: s}))} />
            </Col>
            <Col span={12}>
              <div style={{ fontSize: 11 }}>Texosmotr muddati</div>
              <DatePicker style={{ width: "100%" }} onChange={(_, s) => setNewBook(p => ({...p, tex_expiry: s}))} />
            </Col>
          </Row>
        </div>
      </Modal>

      {/* MODAL: XARAJAT QO'SHISH */}
      <Modal 
        title="Xarajat yozish"
        open={addRecOpen} 
        onOk={handleAddRecord} 
        onCancel={() => setAddRecOpen(false)}
        centered
      >
        <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
          <Select 
            placeholder="Xizmat turi"
            onChange={v => setNewRec(p => ({...p, service_type: v, title: SERVICE_TYPES.find(s => s.id === v)?.label || ""}))}
            options={SERVICE_TYPES.map(s => ({ value: s.id, label: `${s.emoji} ${s.label}` }))} 
          />
          <Input placeholder="Sarlavha" onChange={e => setNewRec(p => ({...p, title: e.target.value}))} />
          <Row gutter={8}>
            <Col span={12}><InputNumber placeholder="Narxi" style={{width:"100%"}} onChange={v => setNewRec(p => ({...p, cost: v}))} /></Col>
            <Col span={12}><InputNumber placeholder="Probeg" style={{width:"100%"}} onChange={v => setNewRec(p => ({...p, mileage_at: v}))} /></Col>
          </Row>
        </div>
      </Modal>

    </div>
  );
}