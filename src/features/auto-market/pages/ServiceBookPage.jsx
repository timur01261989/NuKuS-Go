/**
 * ServiceBookPage.jsx
 * "Rasxod Daftar" — barcha mashinalar va ularning xizmat tarixi.
 * Sodda, tushunarli va 100% TO'LIQ variant.
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
  Tag
} from "antd";
import { 
  ArrowLeftOutlined, 
  PlusOutlined, 
  SafetyCertificateOutlined, 
  FileDoneOutlined,
  EditOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getServiceBooks, createServiceBook, addServiceRecord, updateServiceBook } from "../services/marketBackend";
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

  // Yangi daftar (mashina) qo'shish formasi
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

  // Yangi xarajat/servis qo'shish formasi
  const [newRec, setNewRec] = useState({
    service_type: "",
    title: "",
    mileage_at: "",
    cost: "",
    next_due_km: ""
  });

  // Daftarlarni yuklash
  const load = async () => {
    setLoading(true);
    try {
      const data = await getServiceBooks();
      setBooks(data || []);
    } catch (error) {
      console.error("Xatolik:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // 1. Yangi daftar (mashina) saqlash
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

  // 2. Yangi xarajat saqlash
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
      message.error("Xatolik yuz berdi");
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
              {/* ASOSIY MA'LUMOTLAR */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: 18 }}>
                    {book.car_brand} {book.car_model} {book.car_year && `(${book.car_year})`}
                  </h3>
                  <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
                    Davlat raqami: <b>{book.car_plate || "Kiritilmagan"}</b> • Probeg: <b>{book.current_mileage || 0} km</b>
                  </div>
                </div>
                <Button 
                  type="primary" 
                  size="small"
                  icon={<PlusOutlined />}
                  style={{ borderRadius: 8 }}
                  onClick={() => {
                    setActiveBook(book);
                    setAddRecOpen(true);
                  }}
                >
                  Xarajat yozish
                </Button>
              </div>

              {/* HUJJATLAR (Sug'urta va Texosmotr) */}
              <Row gutter={12} style={{ marginBottom: 16 }}>
                <Col span={12}>
                  <div style={{ background: "#f1f5f9", padding: "8px 12px", borderRadius: 10 }}>
                    <div style={{ fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
                      <SafetyCertificateOutlined /> Sug'urta
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13, marginTop: 2 }}>
                      {book.insurance_expiry ? dayjs(book.insurance_expiry).format("DD.MM.YYYY") : "Kiritilmagan"}
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ background: "#f1f5f9", padding: "8px 12px", borderRadius: 10 }}>
                    <div style={{ fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
                      <FileDoneOutlined /> Tex. ko'rik
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13, marginTop: 2 }}>
                      {book.tex_expiry ? dayjs(book.tex_expiry).format("DD.MM.YYYY") : "Kiritilmagan"}
                    </div>
                  </div>
                </Col>
              </Row>

              {/* XARAJATLAR TARIXI WIDGETI */}
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
                <ServiceBookWidget book={book} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 1. YANGI DAFTAR OCHISH MODALI */}
      <Modal 
        title={<div style={{ fontWeight: 800, fontSize: 18 }}>Yangi Mashina qo'shish</div>}
        open={addBookOpen} 
        onOk={handleAddBook} 
        onCancel={() => setAddBookOpen(false)}
        okText={am("app.add") || "Qo'shish"} 
        cancelText={am("app.cancel") || "Bekor qilish"}
        centered
      >
        <div style={{ display