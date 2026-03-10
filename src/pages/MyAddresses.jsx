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
  PlusOutlined,
  SendOutlined
} from "@ant-design/icons";
import { usePageI18n } from "./pageI18n";

const { Title, Text, Paragraph } = Typography;

/**
 * @const STORAGE_KEY
 * @description Temporary local storage key before DB migration
 */
const STORAGE_KEY = "unigo_addresses_v1";

/**
 * UniGo Brand Colors - Scalable for multi-tenant support
 */
const BRAND = {
  blue: '#0057b7', // Dominant Blue for Driver Side theme
  light: '#ffffff',
  grey: '#f0f2f5'
};

/**
 * Data Access Layer - Mocking Repository Pattern
 * Optimized for high-load: Minimal JSON parsing
 */
const AddressRepository = {
  get: () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch (e) {
      console.error("Storage corruption detected", e);
      return [];
    }
  },
  save: (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
};

// --- Map Picker Modal Placeholder (Scalable for Google/Yandex Maps) ---

const MapPickerModal = memo(({ visible, onClose, onSelect }) => (
  <Modal
    title={<Space><EnvironmentOutlined /> Xaritadan manzilni belgilash</Space>}
    open={visible}
    onCancel={onClose}
    onOk={() => {
      // Mock selection - In real world, get this from Map API callback
      onSelect({
        address: "A. Temur ko'chasi, 22, Nukus",
        lat: 42.4631,
        lng: 59.6015
      });
      onClose();
    }}
    okText="Belgilash"
    cancelText="Bekor qilish"
    width={800}
    style={{ top: 20 }}
    bodyStyle={{ height: '60vh', padding: 0, backgroundColor: '#eaeaea' }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column' }}>
      <Paragraph type="secondary">[ Map Engine integration goes here: Yandex/Google/Leaflet ]</Paragraph>
      <Paragraph type="secondary" style={{ fontSize: 12 }}>Click 'Belgilash' to simulate selection.</Paragraph>
    </div>
  </Modal>
));

MapPickerModal.displayName = "MapPickerModal";


// --- Saved Address Item Component (Memoized for Performance) ---

const AddressItem = memo(({ item, onRemove, t }) => (
  <Card 
    hoverable 
    style={{ 
      borderRadius: 12, 
      border: '1px solid #e0e0e0',
      transition: 'all 0.3s ease'
    }}
    bodyStyle={{ padding: 16 }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <Space align="start">
        <div style={{ 
          background: '#e6f7ff', 
          padding: 8, 
          borderRadius: 10, 
          display: 'flex', 
          alignItems: 'center' 
        }}>
          <HomeFilled style={{ fontSize: 18, color: BRAND.blue }} />
        </div>
        <div>
          <Text strong style={{ fontSize: 15, display: 'block' }}>{item.label}</Text>
          <Paragraph 
            type="secondary" 
            ellipsis={{ rows: 2 }} 
            style={{ margin: 0, maxWidth: 220, fontSize: 13 }}
          >
            {item.address}
          </Paragraph>
          {/* Invisible coordinates data for taxi service usage */}
          <Tag color="cyan" style={{ border: 'none', background: '#f0f0f0', color: '#595959', fontSize: 11, marginTop: 4, display: 'none' }}>
            ({item.latitude}, {item.longitude})
          </Tag>
        </div>
      </Space>
      
      <Popconfirm
        title={t.confirmDelete || "O'chirilsinmi?"}
        onConfirm={() => onRemove(item.id)}
        okText={t.yes || "Ha"}
        cancelText={t.no || "Yo'q"}
        okButtonProps={{ danger: true, size: 'small' }}
        cancelButtonProps={{ size: 'small' }}
      >
        <Button 
          type="text" 
          danger 
          icon={<DeleteOutlined />} 
          style={{ borderRadius: 6 }}
        />
      </Popconfirm>
    </div>
  </Card>
));

AddressItem.displayName = "AddressItem";

// --- Main Page Component ---

const MyAddresses = () => {
  const { t, tx } = usePageI18n();
  const [form] = Form.useForm();
  
  // State management optimized for high-load systems
  const [items, setItems] = useState(() => AddressRepository.get());
  const [isMapModalVisible, setMapModalVisible] = useState(false);

  /**
   * Handle Map Selection Callback
   */
  const handleMapSelect = useCallback((data) => {
    form.setFieldsValue({
      address: data.address,
      latitude: data.lat,
      longitude: data.lng
    });
  }, [form]);

  /**
   * Add Address - Optimized with useCallback
   * Scalability note: Data includes coordinates for taxi service usage
   */
  const handleAdd = useCallback((values) => {
    const newEntry = {
      id: window.crypto.randomUUID ? window.crypto.randomUUID() : Date.now().toString(),
      label: values.label,
      address: values.address,
      // Defaulting to 0 if not provided by map picker placeholder
      latitude: values.latitude || 0,
      longitude: values.longitude || 0,
      createdAt: new Date().toISOString()
    };

    const updatedList = [newEntry, ...items];
    setItems(updatedList);
    AddressRepository.save(updatedList);
    form.resetFields();
    message.success(tx("addressAdded", "Manzil muvaffaqiyatli saqlandi"));
  }, [items, form, tx]);

  /**
   * Remove Address - Atomic operation
   */
  const handleRemove = useCallback((id) => {
    const updatedList = items.filter(x => x.id !== id);
    setItems(updatedList);
    AddressRepository.save(updatedList);
    message.info(tx("addressRemoved", "Manzil o'chirildi"));
  }, [items, tx]);

  // Memoized empty state component
  const emptyView = useMemo(() => (
    <Empty 
      image={Empty.PRESENTED_IMAGE_SIMPLE} 
      description={
        <Text type="secondary">{t.noAddresses || "Hali manzillar yo'q"}</Text>
      }
      style={{ padding: '30px 0' }}
    />
  ), [t.noAddresses]);

  return (
    <div className="unigo-addresses-wrapper" style={{ padding: '24px 16px', maxWidth: 960, margin: '0 auto', minHeight: '100vh', backgroundColor: BRAND.grey }}>
      <header style={{ marginBottom: 32 }}>
        <Title level={2} style={{ marginBottom: 6, fontWeight: 800 }}>
          {t.myAddressesTitle || "Mening manzillarim"}
        </Title>
        <Text type="secondary">
          Taksi chaqirishda va xizmatlarda foydalanish uchun tez-tez ishlatiladigan manzillar
        </Text>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        {/* ADD NEW Address Section - Restyled to Blue Theme */}
        <Card 
          style={{ 
            borderRadius: 20, 
            boxShadow: '0 8px 30px rgba(0,87,183,0.12)', 
            border: 'none',
            backgroundColor: BRAND.blue // Rich blue like driver side
          }}
          bodyStyle={{ padding: 32 }}
        >
          <Form 
            form={form} 
            layout="vertical" 
            onFinish={handleAdd}
            requiredMark={false}
          >
            {/* Hidden fields for coordinates - Crucial for Taxi Dispatch Service */}
            <Form.Item name="latitude" noStyle><Input type="hidden" /></Form.Item>
            <Form.Item name="longitude" noStyle><Input type="hidden" /></Form.Item>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              <Form.Item 
                name="label" 
                label={<Text strong style={{ color: BRAND.light }}>{t.addressName || "Manzil nomi"}</Text>}
                rules={[{ required: true, message: t.nameRequired }]}
              >
                <Input 
                  prefix={<Tag color="blue" style={{ border: 'none', background: '#306cb6', color: BRAND.light }}>#</Tag>}
                  placeholder={tx("addressesPlaceholder", "Uy / Ish / Maktab")} 
                  size="large"
                  style={{ borderRadius: 10, color: '#333' }}
                />
              </Form.Item>

              <Form.Item 
                name="address" 
                label={<Text strong style={{ color: BRAND.light }}>{t.addressField || "To'liq manzil"}</Text>}
                rules={[{ required: true, message: t.addressRequired }]}
              >
                <Input 
                  prefix={<EnvironmentOutlined style={{ color: BRAND.blue }} />}
                  placeholder={t.writeAddress || "Xaritadan tanlash uchun bosing..."} 
                  size="large"
                  readOnly={false}
                  onClick={() => setMapModalVisible(true)}
                  style={{ borderRadius: 10, color: '#333', cursor: 'pointer' }}
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
                marginTop: 12, 
                height: 54, 
                borderRadius: 12, 
                background: BRAND.light, // Contrasting button color
                color: BRAND.blue,
                borderColor: BRAND.light,
                fontWeight: 700 
              }}
            >
              {t.save || "Saqlash"}
            </Button>
          </Form>
        </Card>

        {/* List Header Section */}
        <Divider orientation="left" style={{ margin: '16px 0', borderColor: '#d9d9d9' }}>
          <Text strong style={{ color: '#8c8c8c' }}>SAQLANGANLAR</Text>
        </Divider>

        {/* List Section */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", 
          gap: 16 
        }}>
          {items.map((a) => (
            <AddressItem 
              key={a.id} 
              item={a} 
              onRemove={handleRemove} 
              t={t} 
            />
          ))}
        </div>

        {items.length === 0 && emptyView}
      </div>

      <MapPickerModal
        visible={isMapModalVisible}
        onClose={() => setMapModalVisible(false)}
        onSelect={handleMapSelect}
      />
    </div>
  );
};

export default memo(MyAddresses);