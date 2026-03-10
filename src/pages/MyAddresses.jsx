import React, { useState, useCallback, useMemo, memo } from "react";
import { 
  Button, 
  Card, 
  Form, 
  Input, 
  Typography, 
  Empty, 
  Popconfirm, 
  Space, 
  Tag, 
  Divider, 
  Modal, 
  message 
} from "antd";
import { 
  HomeFilled, 
  EnvironmentOutlined, 
  DeleteOutlined, 
  SendOutlined, 
  SearchOutlined 
} from "@ant-design/icons";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

// Leaflet uchun zarur bo'lgan CSS va Ikonka sozlamalari
import "leaflet/dist/leaflet.css";
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Mahalliy lokalizatsiya hookini import qilish
import { usePageI18n } from "./pageI18n";

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const { Title, Text, Paragraph } = Typography;

/** * @const BRAND 
 * UniGo haydovchilar bo'limi uslubidagi ko'k ranglar palitrasi
 */
const BRAND = {
  blue: '#0057b7',
  light: '#ffffff',
  grey: '#f0f2f5',
  darkBlue: '#004494'
};

const NUKUS_CENTER = [42.4601, 59.6122];
const STORAGE_KEY = "unigo_addresses_v1";

/** * Ma'lumotlarni saqlash va yuklash (Repository Pattern)
 */
const AddressRepository = {
  get: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Storage Error:", e);
      return [];
    }
  },
  save: (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
};

// --- Xaritada klikni aniqlash uchun yordamchi komponent ---
const MapClickHandler = ({ onSelect }) => {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// --- Xarita Modali (Map Picker) ---
const MapPickerModal = memo(({ visible, onClose, onSelect }) => {
  const [tempPos, setTempPos] = useState(NUKUS_CENTER);

  const handleConfirm = useCallback(async () => {
    try {
      // Nominatim API orqali kordinatani manzilga aylantirish (Reverse Geocoding)
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${tempPos[0]}&lon=${tempPos[1]}`);
      const data = await res.json();
      
      onSelect({
        address: data.display_name || "Tanlangan manzil",
        lat: tempPos[0],
        lng: tempPos[1]
      });
      onClose();
    } catch (err) {
      message.error("Manzilni aniqlashda xatolik yuz berdi");
    }
  }, [tempPos, onSelect, onClose]);

  return (
    <Modal
      title={<Space><EnvironmentOutlined /> Xaritadan manzilni belgilash</Space>}
      open={visible}
      onCancel={onClose}
      onOk={handleConfirm}
      okText="Manzilni tasdiqlash"
      cancelText="Bekor qilish"
      width={1000}
      centered
      destroyOnClose
      bodyStyle={{ padding: 0, height: '65vh', position: 'relative' }}
    >
      <div style={{ height: '100%', width: '100%' }}>
        <MapContainer 
          center={NUKUS_CENTER} 
          zoom={14} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer 
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
            attribution='&copy; OpenStreetMap contributors'
          />
          <Marker position={tempPos} />
          <MapClickHandler onSelect={(lat, lng) => setTempPos([lat, lng])} />
        </MapContainer>
        <div style={{ 
          position: 'absolute', 
          bottom: 20, 
          left: 20, 
          zIndex: 1000, 
          background: 'white', 
          padding: '8px 15px', 
          borderRadius: 8,
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Kordinatalar: {tempPos[0].toFixed(5)}, {tempPos[1].toFixed(5)}
          </Text>
        </div>
      </div>
    </Modal>
  );
});

MapPickerModal.displayName = "MapPickerModal";

// --- Saqlangan manzillar ro'yxati elementi ---
const AddressItem = memo(({ item, onRemove }) => (
  <Card 
    hoverable 
    style={{ borderRadius: 15, border: '1px solid #e8e8e8' }}
    bodyStyle={{ padding: 18 }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <Space align="start" size={12}>
        <div style={{ background: '#e6f4ff', padding: 10, borderRadius: 12 }}>
          <HomeFilled style={{ fontSize: 20, color: BRAND.blue }} />
        </div>
        <div>
          <Text strong style={{ fontSize: 16, display: 'block' }}>{item.label}</Text>
          <Paragraph 
            type="secondary" 
            ellipsis={{ rows: 2 }} 
            style={{ margin: 0, maxWidth: 240, fontSize: 13 }}
          >
            {item.address}
          </Paragraph>
        </div>
      </Space>
      <Popconfirm 
        title="Ushbu manzilni o'chirmoqchimisiz?" 
        onConfirm={() => onRemove(item.id)} 
        okText="Ha" 
        cancelText="Yo'q"
        okButtonProps={{ danger: true }}
      >
        <Button type="text" danger icon={<DeleteOutlined />} />
      </Popconfirm>
    </div>
  </Card>
));

AddressItem.displayName = "AddressItem";

// --- ASOSIY KOMPONENT ---
const MyAddresses = () => {
  const { t } = usePageI18n();
  const [form] = Form.useForm();
  const [items, setItems] = useState(() => AddressRepository.get());
  const [isMapOpen, setIsMapOpen] = useState(false);

  // Manzil qo'shish logikasi (Taksi va boshqa xizmatlar uchun kordinatalari bilan)
  const onFinish = useCallback((values) => {
    const newEntry = {
      id: window.crypto.randomUUID ? window.crypto.randomUUID() : Date.now().toString(),
      label: values.label,
      address: values.address,
      latitude: values.latitude,
      longitude: values.longitude,
      createdAt: new Date().toISOString()
    };
    
    const updated = [newEntry, ...items];
    setItems(updated);
    AddressRepository.save(updated);
    form.resetFields();
    message.success("Manzil muvaffaqiyatli saqlandi");
  }, [items, form]);

  const removeAddress = useCallback((id) => {
    const updated = items.filter(x => x.id !== id);
    setItems(updated);
    AddressRepository.save(updated);
    message.info("Manzil o'chirildi");
  }, [items]);

  // Xaritadan tanlangan ma'lumotlarni formaga o'tkazish
  const handleMapSelection = useCallback((data) => {
    form.setFieldsValue({
      address: data.address,
      latitude: data.lat,
      longitude: data.lng
    });
  }, [form]);

  return (
    <div style={{ 
      padding: '30px 20px', 
      maxWidth: 1000, 
      margin: '0 auto', 
      backgroundColor: BRAND.grey, 
      minHeight: '100vh' 
    }}>
      <header style={{ marginBottom: 35 }}>
        <Title level={2} style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1 }}>
          {t?.myAddressesTitle || "Mening manzillarim"}
        </Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          TEZ-TEZ TASHRIF BUYURADIGAN MANZILLARINGIZNI BOSHQARING
        </Text>
      </header>

      {/* YANGI MANZIL QO'SHISH FORMASI (KO'K DIZAYNDA) */}
      <Card 
        style={{ 
          borderRadius: 25, 
          background: BRAND.blue, 
          border: 'none', 
          marginBottom: 40, 
          boxShadow: '0 12px 40px rgba(0,87,183,0.2)' 
        }}
        bodyStyle={{ padding: 35 }}
      >
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={onFinish}
          requiredMark={false}
        >
          {/* Yashirin kordinatalar maydoni */}
          <Form.Item name="latitude" noStyle><Input type="hidden" /></Form.Item>
          <Form.Item name="longitude" noStyle><Input type="hidden" /></Form.Item>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 25 }}>
            <Form.Item 
              name="label" 
              label={<Text strong style={{ color: BRAND.light, fontSize: 13 }}>MANZIL NOMI</Text>} 
              rules={[{ required: true, message: "Nomini kiriting" }]}
            >
              <Input 
                placeholder="Uy / Ish / Maktab" 
                size="large" 
                style={{ borderRadius: 12, height: 50, border: 'none' }} 
              />
            </Form.Item>

            <Form.Item 
              name="address" 
              label={<Text strong style={{ color: BRAND.light, fontSize: 13 }}>TO'LIQ MANZIL</Text>} 
              rules={[{ required: true, message: "Manzilni belgilang" }]}
            >
              <Input 
                prefix={<SearchOutlined style={{ color: BRAND.blue }} />}
                placeholder="Xaritadan belgilash uchun bosing..." 
                size="large" 
                readOnly 
                onClick={() => setIsMapOpen(true)}
                style={{ borderRadius: 12, height: 50, border: 'none', cursor: 'pointer' }} 
              />
            </Form.Item>
          </div>

          <Button 
            type="primary" 
            htmlType="submit" 
            size="large" 
            block 
            icon={<SendOutlined />}
            style={{ 
              marginTop: 25, 
              height: 55, 
              borderRadius: 15, 
              background: BRAND.light, 
              color: BRAND.blue, 
              fontWeight: 800, 
              border: 'none',
              fontSize: 16
            }}
          >
            SAQLASH
          </Button>
        </Form>
      </Card>

      <Divider orientation="left" style={{ borderColor: '#d1d1d1' }}>
        <Text strong style={{ color: '#8c8c8c', fontSize: 12 }}>SAQLANGANLAR</Text>
      </Divider>
      
      {/* SAQLANGAN MANZILLAR RO'YXATI */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
        gap: 20,
        marginTop: 20 
      }}>
        {items.map(item => (
          <AddressItem 
            key={item.id} 
            item={item} 
            onRemove={removeAddress} 
          />
        ))}
      </div>

      {items.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: 50 }}>
          <Empty description="Sizda hali saqlangan manzillar yo'q" />
        </div>
      )}

      {/* XARITA MODALI INTEGRATSIYASI */}
      <MapPickerModal 
        visible={isMapOpen} 
        onClose={() => setIsMapOpen(false)} 
        onSelect={handleMapSelection} 
      />

      <footer style={{ marginTop: 60, textAlign: 'center', opacity: 0.5 }}>
        <Text style={{ fontSize: 12 }}>UniGo v1.0.8 • Yagona Yechim • Nukus, 2026</Text>
      </footer>
    </div>
  );
};

export default memo(MyAddresses);