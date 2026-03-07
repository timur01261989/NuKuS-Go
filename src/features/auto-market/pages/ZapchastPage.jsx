/**
 * ZapchastPage.jsx
 * Ehtiyot qismlar bo'limi.
 * 100% TO'LIQ VARIANT - HECH QANDAY QISQARTIRMASIZ.
 * Smart filter: marka/model tanlansa, faqat o'sha mashinaga mos qismlar chiqadi.
 * YANGI: Kategoriya slayderi, Qidiruv tizimi va Premium e'lonlar dizayni.
 */
import React, { useEffect, useState, useMemo } from "react";
import { 
  Button, 
  Select, 
  Input, 
  Spin, 
  Empty, 
  Tag, 
  Modal, 
  message, 
  Row, 
  Col, 
  Card, 
  Badge,
  Avatar
} from "antd";
import { 
  ArrowLeftOutlined, 
  PlusOutlined, 
  PhoneOutlined, 
  SearchOutlined, 
  FilterOutlined, 
  CarOutlined, 
  CheckCircleOutlined,
  EnvironmentOutlined,
  ShoppingOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { listZapchast, createZapchastAd } from "../services/marketBackend";
import { BRANDS, MODELS_BY_BRAND, ZAPCHAST_CATEGORIES, ZAPCHAST_CONDITIONS } from "../services/staticData";

// --- Ehtiyot qismi kartasi komponenti ---
function ZapchastCard({ item }) {
  const cat = ZAPCHAST_CATEGORIES.find(c => c.id === item.category);
  const condition = ZAPCHAST_CONDITIONS.find(c => c.value === item.condition);

  return (
    <div style={{
      background: "#fff", 
      border: "1px solid #e2e8f0", 
      borderRadius: 20,
      padding: 14, 
      boxShadow: "0 4px 16px rgba(2,6,23,.03)",
      display: "flex", 
      gap: 12,
      marginBottom: 12,
      position: "relative"
    }}>
      {item.is_premium && (
        <Badge.Ribbon text="Premium" color="gold" style={{ top: -10 }} />
      )}
      
      <div style={{
        width: 64, 
        height: 64, 
        borderRadius: 16, 
        background: item.is_premium ? "#fefce8" : "#f1f5f9",
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        fontSize: 28, 
        flexShrink: 0,
        border: item.is_premium ? "1px solid #fde047" : "1px solid transparent"
      }}>
        {cat?.emoji || "📦"}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <h4 style={{ margin: 0, fontWeight: 800, fontSize: 16, color: "#1e293b" }}>{item.title}</h4>
          <Tag color={condition?.color || "blue"} style={{ borderRadius: 6, margin: 0, fontSize: 10 }}>
            {condition?.label || item.condition}
          </Tag>
        </div>
        
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
          <CarOutlined style={{ fontSize: 14 }} />
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {item.compatible_brand} {item.compatible_model} uchun
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
          <div style={{ fontWeight: 900, fontSize: 17, color: "#059669" }}>
            {item.price?.toLocaleString()} <span style={{ fontSize: 12 }}>{item.currency}</span>
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>
            <EnvironmentOutlined /> {item.city || "O'zbekiston"}
          </div>
        </div>
      </div>

      <Button 
        type="primary" 
        shape="circle" 
        icon={<PhoneOutlined />} 
        style={{ 
          alignSelf: "center", 
          background: "#0ea5e9", 
          border: "none",
          boxShadow: "0 4px 10px rgba(14,165,233,0.3)"
        }}
        onClick={() => {
          if (item.phone) window.location.href = `tel:${item.phone}`;
          else message.info("Telefon raqami ko'rsatilmagan");
        }}
      />
    </div>
  );
}

// --- Asosiy Sahifa ---
export default function ZapchastPage() {
  const nav = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filtrlar holati
  const [filter, setFilter] = useState({ brand: "", model: "", category: "" });
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal (E'lon berish) holati
  const [isModal, setIsModal] = useState(false);
  const [newItem, setNewItem] = useState({
    title: "", category: "", compatible_brand: "", compatible_model: "",
    price: "", currency: "UZS", condition: "new", city: "", phone: "", desc: ""
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await listZapchast();
      setList(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Filtrlangan ro'yxat
  const filteredList = useMemo(() => {
    return list.filter(item => {
      const mBrand = !filter.brand || item.compatible_brand === filter.brand;
      const mModel = !filter.model || item.compatible_model === filter.model;
      const mCat = !filter.category || item.category === filter.category;
      const mSearch = !searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase());
      return mBrand && mModel && mCat && mSearch;
    });
  }, [list, filter, searchQuery]);

  const handleCreate = async () => {
    if (!newItem.title || !newItem.category || !newItem.price) {
      return message.warning("Asosiy maydonlarni to'ldiring");
    }
    try {
      await createZapchastAd(newItem);
      message.success("E'loningiz muvaffaqiyatli qo'shildi!");
      setIsModal(false);
      load();
    } catch (e) {
      message.error("Xatolik yuz berdi");
    }
  };

  return (
    <div style={{ padding: "16px 16px 100px", background: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
        <Button icon={<ArrowLeftOutlined />} shape="circle" onClick={() => nav(-1)} />
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontWeight: 950, fontSize: 22 }}>Ehtiyot qismlar</h1>
          <div style={{ fontSize: 12, color: "#64748b" }}>Bozordagi barcha detallar bir joyda</div>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          style={{ borderRadius: 12, height: 40, background: "#10b981", border: "none" }}
          onClick={() => setIsModal(true)}
        >
          Sotish
        </Button>
      </div>

      {/* Qidiruv va Brend Filter */}
      <Card style={{ borderRadius: 24, border: "none", boxShadow: "0 4px 15px rgba(0,0,0,0.04)", marginBottom: 16 }}>
        <Input 
          prefix={<SearchOutlined style={{ color: "#94a3b8" }} />} 
          placeholder="Zapchast nomini qidiring..." 
          size="large"
          variant="filled"
          style={{ borderRadius: 14, marginBottom: 12 }}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <Row gutter={8}>
          <Col span={12}>
            <Select 
              placeholder="Marka tanlang" 
              style={{ width: "100%" }} 
              allowClear
              value={filter.brand || undefined}
              onChange={v => setFilter(p => ({ ...p, brand: v || "", model: "" }))}
              options={BRANDS.map(b => ({ value: b.name, label: b.name }))}
            />
          </Col>
          <Col span={12}>
            <Select 
              placeholder="Model tanlang" 
              style={{ width: "100%" }} 
              disabled={!filter.brand}
              value={filter.model || undefined}
              onChange={v => setFilter(p => ({ ...p, model: v || "" }))}
              options={(MODELS_BY_BRAND[filter.brand] || []).map(m => ({ value: m, label: m }))}
            />
          </Col>
        </Row>
      </Card>

      {/* Kategoriya slayderi */}
      <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 16, scrollbarWidth: "none" }}>
        <Tag 
          color={!filter.category ? "blue" : "default"} 
          style={{ padding: "6px 16px", borderRadius: 12, cursor: "pointer", fontSize: 13 }}
          onClick={() => setFilter(p => ({ ...p, category: "" }))}
        >
          Hammasi
        </Tag>
        {ZAPCHAST_CATEGORIES.map(c => (
          <Tag 
            key={c.id}
            color={filter.category === c.id ? "blue" : "default"}
            style={{ padding: "6px 16px", borderRadius: 12, cursor: "pointer", fontSize: 13 }}
            onClick={() => setFilter(p => ({ ...p, category: c.id }))}
          >
            {c.emoji} {c.label}
          </Tag>
        ))}
      </div>

      {/* Ro'yxat */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 50 }}><Spin size="large" /></div>
      ) : filteredList.length === 0 ? (
        <Empty description="Zapchastlar topilmadi" style={{ marginTop: 40 }} />
      ) : (
        <div style={{ marginTop: 8 }}>
          {filteredList.map(item => <ZapchastCard key={item.id} item={item} />)}
        </div>
      )}

      {/* E'lon berish modali */}
      <Modal
        title={<div style={{ fontWeight: 800 }}><ShoppingOutlined /> Detal sotish</div>}
        open={isModal}
        onCancel={() => setIsModal(false)}
        onOk={handleCreate}
        okText="E'lonni joylash"
        cancelText="Bekor qilish"
        centered
        width={400}
        borderRadius={24}
      >
        <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
          <Input 
            placeholder="Zapchast nomi (masalan: Akkumulyator 75A)" 
            value={newItem.title} 
            onChange={e => setNewItem(p => ({ ...p, title: e.target.value }))} 
          />
          <Select 
            placeholder="Kategoriya" 
            value={newItem.category || undefined}
            onChange={v => setNewItem(p => ({ ...p, category: v }))}
            options={ZAPCHAST_CATEGORIES.map(c => ({ value: c.id, label: `${c.emoji} ${c.label}` }))} 
          />
          <Row gutter={8}>
            <Col span={12}>
              <Select 
                placeholder="Mos marka" 
                value={newItem.compatible_brand || undefined}
                onChange={v => setNewItem(p => ({ ...p, compatible_brand: v || "", compatible_model: "" }))}
                options={BRANDS.map(b => ({ value: b.name, label: b.name }))} 
                style={{ width: "100%" }}
              />
            </Col>
            <Col span={12}>
              <Input 
                placeholder="Mos model" 
                value={newItem.compatible_model} 
                onChange={e => setNewItem(p => ({ ...p, compatible_model: e.target.value }))} 
              />
            </Col>
          </Row>
          <Row gutter={8}>
            <Col span={16}>
              <Input 
                placeholder="Narx" 
                type="number" 
                value={newItem.price} 
                onChange={e => setNewItem(p => ({ ...p, price: e.target.value }))} 
              />
            </Col>
            <Col span={8}>
              <Select 
                value={newItem.currency} 
                onChange={v => setNewItem(p => ({ ...p, currency: v }))}
                options={[{ value: "UZS", label: "UZS" }, { value: "USD", label: "USD" }]} 
                style={{ width: "100%" }}
              />
            </Col>
          </Row>
          <Select 
            placeholder="Holati" 
            value={newItem.condition} 
            onChange={v => setNewItem(p => ({ ...p, condition: v }))}
            options={ZAPCHAST_CONDITIONS.map(c => ({ value: c.value, label: c.label }))} 
          />
          <Input 
            placeholder="Telefon raqam" 
            value={newItem.phone} 
            onChange={e => setNewItem(p => ({ ...p, phone: e.target.value }))} 
          />
          <Input.TextArea 
            placeholder="Qo'shimcha ma'lumot (ixtiyoriy)" 
            rows={3}
            value={newItem.desc} 
            onChange={e => setNewItem(p => ({ ...p, desc: e.target.value }))} 
          />
        </div>
      </Modal>

      {/* Floating Info */}
      <div style={{ 
        position: "fixed", 
        bottom: 20, 
        left: 20, 
        right: 20, 
        background: "#0f172a", 
        color: "#fff", 
        padding: "12px 20px", 
        borderRadius: 100, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between",
        boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <CheckCircleOutlined style={{ color: "#10b981" }} />
          <span>Xavfsiz bitim kafolati</span>
        </div>
        <Button type="link" style={{ padding: 0, color: "#3b82f6", fontSize: 13 }}>Batafsil</Button>
      </div>
    </div>
  );
}