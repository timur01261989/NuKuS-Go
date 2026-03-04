/**
 * ServiceBookPage.jsx
 * "Rasxod Daftar" — barcha mashinalar va ularning xizmat tarixi.
 */
import React, { useEffect, useState } from "react";
import { Button, Empty, Modal, Input, Select, InputNumber, DatePicker, message, Spin } from "antd";
import { ArrowLeftOutlined, PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getServiceBooks, createServiceBook, addServiceRecord, updateServiceBook } from "../services/marketBackend";
import { BRANDS, SERVICE_TYPES } from "../services/staticData";
import ServiceBookWidget from "../components/Details/ServiceBookWidget";
import dayjs from "dayjs";

export default function ServiceBookPage() {
  const nav = useNavigate();
  const [books, setBooks]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [addBookOpen, setAddBookOpen] = useState(false);
  const [addRecOpen, setAddRecOpen]   = useState(false);
  const [activeBook, setActiveBook]   = useState(null);

  const [newBook, setNewBook] = useState({
    car_brand:"", car_model:"", car_year:"", car_plate:"",
    current_mileage:0, oil_change_km:10000, last_oil_change:0,
    insurance_expiry:"", tex_expiry:"",
  });
  const [newRec, setNewRec] = useState({
    service_type:"oil_change", title:"", mileage_at:"",
    cost:"", currency:"UZS", next_due_km:"", note:""
  });

  const load = async () => {
    setLoading(true);
    try { setBooks(await getServiceBooks()); }
    catch { setBooks([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAddBook = async () => {
    if (!newBook.car_brand || !newBook.car_model) { message.warning("Marka va model kiriting"); return; }
    await createServiceBook(newBook);
    setAddBookOpen(false);
    setNewBook({ car_brand:"", car_model:"", car_year:"", car_plate:"", current_mileage:0, oil_change_km:10000, last_oil_change:0, insurance_expiry:"", tex_expiry:"" });
    load();
    message.success("Daftar yaratildi!");
  };

  const handleAddRecord = async () => {
    if (!newRec.title || !activeBook) return;
    await addServiceRecord(activeBook.id, newRec);
    setAddRecOpen(false);
    setNewRec({ service_type:"oil_change", title:"", mileage_at:"", cost:"", currency:"UZS", next_due_km:"", note:"" });
    load();
    message.success("Yozuv qo'shildi!");
  };

  const openAddRecord = (book) => {
    setActiveBook(book);
    setAddRecOpen(true);
  };

  return (
    <div style={{ padding:"14px 14px 90px" }}>
      <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={()=>nav(-1)} style={{ borderRadius:14 }} />
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:950, fontSize:18, color:"#0f172a" }}>📖 Rasxod Daftar</div>
          <div style={{ fontSize:11, color:"#64748b" }}>Mashina xizmat tarixi</div>
        </div>
        <Button icon={<PlusOutlined />} type="primary" onClick={()=>setAddBookOpen(true)}
          style={{ borderRadius:12, background:"#3b82f6", border:"none" }}>Mashina</Button>
      </div>

      {loading ? (
        <div style={{ display:"flex", justifyContent:"center", padding:40 }}><Spin size="large" /></div>
      ) : books.length === 0 ? (
        <Empty description="Hali mashina qo'shilmagan" style={{ marginTop:60 }}>
          <Button type="primary" onClick={()=>setAddBookOpen(true)} style={{ borderRadius:12, background:"#3b82f6", border:"none" }}>
            Mashina qo'shish
          </Button>
        </Empty>
      ) : (
        <div style={{ display:"grid", gap:14 }}>
          {books.map(book => (
            <ServiceBookWidget key={book.id} book={book} onAddRecord={() => openAddRecord(book)} />
          ))}
        </div>
      )}

      {/* Mashina qo'shish modal */}
      <Modal title="Yangi mashina qo'shish" open={addBookOpen} onOk={handleAddBook} onCancel={()=>setAddBookOpen(false)}
        okText="Qo'shish" cancelText="Bekor">
        <div style={{ display:"grid", gap:10, marginTop:10 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            <Select value={newBook.car_brand||undefined} allowClear placeholder="Marka"
              onChange={v=>setNewBook(p=>({...p,car_brand:v||""}))}
              options={BRANDS.map(b=>({value:b.name,label:b.name}))} style={{width:"100%"}} />
            <Input placeholder="Model" value={newBook.car_model}
              onChange={e=>setNewBook(p=>({...p,car_model:e.target.value}))} />
            <InputNumber placeholder="Yil" value={newBook.car_year||undefined}
              onChange={v=>setNewBook(p=>({...p,car_year:v}))} style={{width:"100%"}} min={1990} max={2030} />
            <Input placeholder="Davlat raqami (ixtiyoriy)" value={newBook.car_plate}
              onChange={e=>setNewBook(p=>({...p,car_plate:e.target.value}))} />
          </div>
          <InputNumber placeholder="Hozirgi probeg (km)" value={newBook.current_mileage||undefined}
            onChange={v=>setNewBook(p=>({...p,current_mileage:v||0}))} style={{width:"100%"}} min={0} />
          <InputNumber placeholder="Moy almashtirish intervalı (km)" value={newBook.oil_change_km||undefined}
            onChange={v=>setNewBook(p=>({...p,oil_change_km:v||10000}))} style={{width:"100%"}} min={1000} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            <Input placeholder="Sug'urta tugashi (sana)" value={newBook.insurance_expiry}
              onChange={e=>setNewBook(p=>({...p,insurance_expiry:e.target.value}))} />
            <Input placeholder="Texosmotr tugashi (sana)" value={newBook.tex_expiry}
              onChange={e=>setNewBook(p=>({...p,tex_expiry:e.target.value}))} />
          </div>
        </div>
      </Modal>

      {/* Yozuv qo'shish modal */}
      <Modal title={`Yozuv: ${activeBook?.car_brand} ${activeBook?.car_model}`}
        open={addRecOpen} onOk={handleAddRecord} onCancel={()=>setAddRecOpen(false)}
        okText="Qo'shish" cancelText="Bekor">
        <div style={{ display:"grid", gap:10, marginTop:10 }}>
          <Select value={newRec.service_type} onChange={v=>setNewRec(p=>({...p,service_type:v,title:SERVICE_TYPES.find(s=>s.id===v)?.label||""}))}
            style={{width:"100%"}}
            options={SERVICE_TYPES.map(s=>({value:s.id,label:`${s.emoji} ${s.label}`}))} />
          <Input placeholder="Sarlavha" value={newRec.title}
            onChange={e=>setNewRec(p=>({...p,title:e.target.value}))} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            <InputNumber placeholder="Probeg (km)" value={newRec.mileage_at||undefined}
              onChange={v=>setNewRec(p=>({...p,mileage_at:v||""}))} style={{width:"100%"}} min={0} />
            <InputNumber placeholder="Narx" value={newRec.cost||undefined}
              onChange={v=>setNewRec(p=>({...p,cost:v||""}))} style={{width:"100%"}} min={0} />
            <InputNumber placeholder="Keyingi xizmat (km)" value={newRec.next_due_km||undefined}
              onChange={v=>setNewRec(p=>({...p,next_due_km:v||""}))} style={{width:"100%"}} min={0} />
          </div>
          <Input.TextArea placeholder="Izoh" value={newRec.note}
            onChange={e=>setNewRec(p=>({...p,note:e.target.value}))} rows={2} />
        </div>
      </Modal>
    </div>
  );
}
