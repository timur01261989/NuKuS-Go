/**
 * ServiceBookPage.jsx
 * "Rasxod Daftar" — barcha mashinalar va ularning xizmat tarixi.
 * Sug'urta va Texosmotr qo'shilgan, xatosiz TO'LIQ variant.
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
  Col
} from "antd";
import { 
  ArrowLeftOutlined, 
  PlusOutlined, 
  SafetyCertificateOutlined, 
  FileDoneOutlined 
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
    oil_change_km: 10000, 
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
        current_mileage: 0, oil_change_km: 10000, last_oil_change: 0,
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
        <div style={{ display: "grid", gap: 16 }}>
          {books.map(book => (
            <Card 
              key={book.id} 
              style={{ borderRadius: 16, border: "1px solid #e2e8f0" }}
              bodyStyle={{ padding: 16 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: 18 }}>
                    {book.car_brand} {book.car_model} {book.car_year && `(${book.car_year})`}
                  </h3>
                  <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
                    Raqam: <b>{book.car_plate || "---"}</b> • Probeg: <b>{book.current_mileage || 0} km</b>
                  </div>
                </div>
                <Button 
                  type="primary" 
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setActiveBook(book);
                    setAddRecOpen(true);
                  }}
                >
                  Xarajat
                </Button>
              </div>

              {/* Sug'urta va Texosmotr paneli */}
              <Row gutter={12} style={{ marginBottom: 16 }}>
                <Col span={12}>
                  <div style={{ background: "#f1f5f9", padding: "8px 12px", borderRadius: 10 }}>
                    <div style={{ fontSize: 11, color: "#64748b" }}><SafetyCertificateOutlined /> Sug'urta</div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>
                      {book.insurance_expiry ? dayjs(book.insurance_expiry).format("DD.MM.YYYY") : "---"}
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ background: "#f1f5f9", padding: "8px 12px", borderRadius: 10 }}>
                    <div style={{ fontSize: 11, color: "#64748b" }}><FileDoneOutlined /> Tex. ko'rik</div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>
                      {book.tex_expiry ? dayjs(book.tex_expiry).format("DD.MM.YYYY") : "---"}
                    </div>
                  </div>
                </Col>
              </Row>

              <ServiceBookWidget book={book} />
            </Card>
          ))}
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
            value={newBook.car_brand || undefined}
            onChange={v => setNewBook(p => ({...p, car_brand: v || ""}))}
            options={BRANDS.map(b => ({ value: b.name, label: b.name }))} 
            style={{ width: "100%" }} 
          />
          <Input 
            placeholder="Model (Masalan: Cobalt)" 
            value={newBook.car_model}
            onChange={e => setNewBook(p => ({...p, car_model: e.target.value}))} 
          />
          <Row gutter={8}>
            <Col span={12}><Input placeholder="Yili" value={newBook.car_year} onChange={e => setNewBook(p => ({...p, car_year: e.target.value}))} /></Col>
            <Col span={12}><Input placeholder="Raqami" value={newBook.car_plate} onChange={e => setNewBook(p => ({...p, car_plate: e.target.value}))} /></Col>
          </Row>
          <InputNumber 
            placeholder="Hozirgi probeg (km)" 
            value={newBook.current_mileage || undefined}
            onChange={v => setNewBook(p => ({...p, current_mileage: v || 0}))} 
            style={{ width: "100%" }} 
          />
          <Row gutter={8}>
            <Col span={12}>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Sug'urta tugashi</div>
              <DatePicker style={{ width: "100%" }} onChange={(_, s) => setNewBook(p => ({...p, insurance_expiry: s}))} />
            </Col>
            <Col span={12}>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Texosmotr tugashi</div>
              <DatePicker style={{ width: "100%" }} onChange={(_, s) => setNewBook(p => ({...p, tex_expiry: s}))} />
            </Col>
          </Row>
        </div>
      </Modal>

      {/* MODAL: XARAJAT QO'SHISH */}
      <Modal 
        title={`Xarajat: ${activeBook?.car_model || ""}`}
        open={addRecOpen} 
        onOk={handleAddRecord} 
        onCancel={() => setAddRecOpen(false)}
        centered
      >
        <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
          <Select 
            placeholder="Xizmat turi"
            value={newRec.service_type || undefined} 
            onChange={v => setNewRec(p => ({...p, service_type: v, title: SERVICE_TYPES.find(s => s.id === v)?.label || ""}))}
            options={SERVICE_TYPES.map(s => ({ value: s.id, label: `${s.emoji} ${s.label}` }))} 
          />
          <Input 
            placeholder="Sarlavha" 
            value={newRec.title}
            onChange={e => setNewRec(p => ({...p, title: e.target.value}))} 
          />
          <Row gutter={8}>
            <Col span={12}><InputNumber placeholder="Narxi" style={{width:"100%"}} onChange={v => setNewRec(p => ({...p, cost: v || ""}))} /></Col>
            <Col span={12}><InputNumber placeholder="Probeg" style={{width:"100%"}} onChange={v => setNewRec(p => ({...p, mileage_at: v || ""}))} /></Col>
          </Row>
          <InputNumber 
            placeholder="Keyingi servis (km)" 
            style={{ width: "100%" }} 
            onChange={v => setNewRec(p => ({...p, next_due_km: v || ""}))} 
          />
        </div>
      </Modal>

    </div>
  );
}