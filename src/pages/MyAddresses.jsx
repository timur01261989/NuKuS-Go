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
  message 
} from "antd";
import { 
  HomeOutlined, 
  EnvironmentOutlined, 
  DeleteOutlined, 
  PlusOutlined,
  EnvironmentFilled
} from "@ant-design/icons";
import { usePageI18n } from "./pageI18n";

const { Title, Text, Paragraph } = Typography;

/**
 * @const STORAGE_KEY
 * @description Temporary local storage key before DB migration
 */
const STORAGE_KEY = "unigo_addresses_v1";

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

// --- Sub-Components (Memoized for Performance) ---

const AddressItem = memo(({ item, onRemove, t }) => (
  <Card 
    hoverable 
    style={{ 
      borderRadius: 20, 
      border: '1px solid #f0f0f0',
      transition: 'all 0.3s ease'
    }}
    bodyStyle={{ padding: 20 }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <Space align="start">
        <div style={{ 
          background: '#f0f2f5', 
          padding: 10, 
          borderRadius: 12, 
          display: 'flex', 
          alignItems: 'center' 
        }}>
          <HomeOutlined style={{ fontSize: 20, color: '#1890ff' }} />
        </div>
        <div>
          <Text strong style={{ fontSize: 16, display: 'block' }}>{item.label}</Text>
          <Paragraph 
            type="secondary" 
            ellipsis={{ rows: 2 }} 
            style={{ margin: 0, maxWidth: 200 }}
          >
            {item.address}
          </Paragraph>
        </div>
      </Space>
      
      <Popconfirm
        title={t.confirmDelete || "Manzilni o'chirmoqchimisiz?"}
        onConfirm={() => onRemove(item.id)}
        okText={t.yes || "Ha"}
        cancelText={t.no || "Yo'q"}
        okButtonProps={{ danger: true }}
      >
        <Button 
          type="text" 
          danger 
          icon={<DeleteOutlined />} 
          style={{ borderRadius: 8 }}
        />
      </Popconfirm>
    </div>
  </Card>
));

AddressItem.displayName = "AddressItem";

// --- Main Component ---

const MyAddresses = () => {
  const { t, tx } = usePageI18n();
  const [form] = Form.useForm();
  
  // State management optimized for high-load systems
  const [items, setItems] = useState(() => AddressRepository.get());

  /**
   * Add Address - Optimized with useCallback
   * Scalability note: This should be an async Supabase call in production
   */
  const handleAdd = useCallback((values) => {
    const newEntry = {
      id: window.crypto.randomUUID ? window.crypto.randomUUID() : Date.now().toString(),
      label: values.label,
      address: values.address,
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
        <Text type="secondary">{t.noAddresses || "Sizda hali saqlangan manzillar yo'q"}</Text>
      }
    />
  ), [t.noAddresses]);

  return (
    <div className="unigo-addresses-wrapper" style={{ padding: '24px 16px', maxWidth: 900, margin: '0 auto' }}>
      <header style={{ marginBottom: 32 }}>
        <Title level={2} style={{ marginBottom: 8, fontWeight: 800 }}>
          {t.myAddressesTitle || "Mening manzillarim"}
        </Title>
        <Text type="secondary">
          Tez-tez tashrif buyuradigan manzillaringizni boshqaring
        </Text>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 32 }}>
        {/* Form Section */}
        <Card 
          title={<Space><PlusOutlined /> {tx("addNew", "Yangi manzil qo'shish")}</Space>}
          style={{ borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: 'none' }}
        >
          <Form 
            form={form} 
            layout="vertical" 
            onFinish={handleAdd}
            requiredMark={false}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <Form.Item 
                name="label" 
                label={<Text strong>{t.addressName || "Manzil nomi"}</Text>}
                rules={[{ required: true, message: t.nameRequired }]}
              >
                <Input 
                  prefix={<Tag color="blue">#</Tag>}
                  placeholder={tx("addressesPlaceholder", "Uy / Ish / Maktab")} 
                  size="large"
                  style={{ borderRadius: 12 }}
                />
              </Form.Item>

              <Form.Item 
                name="address" 
                label={<Text strong>{t.addressField || "To'liq manzil"}</Text>}
                rules={[{ required: true, message: t.addressRequired }]}
              >
                <Input 
                  prefix={<EnvironmentOutlined style={{ color: '#bfbfbf' }} />}
                  placeholder={t.writeAddress || "Ko'cha nomi, uy raqami..."} 
                  size="large"
                  style={{ borderRadius: 12 }}
                />
              </Form.Item>
            </div>
            
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large" 
              block 
              icon={<PlusOutlined />}
              style={{ 
                marginTop: 8, 
                height: 50, 
                borderRadius: 15, 
                background: '#000', 
                borderColor: '#000',
                fontWeight: 600 
              }}
            >
              {t.save || "Saqlash"}
            </Button>
          </Form>
        </Card>

        <Divider orientation="left" style={{ margin: '16px 0' }}>
          <Text strong style={{ color: '#8c8c8c' }}>SAQLANGANLAR</Text>
        </Divider>

        {/* List Section */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", 
          gap: 20 
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

      <footer style={{ marginTop: 60, textAlign: 'center' }}>
        <Space split={<Divider type="vertical" />}>
          <Text type="secondary" style={{ fontSize: 12 }}>UniGo v1.0.4</Text>
          <EnvironmentFilled style={{ color: '#d9d9d9' }} />
          <Text type="secondary" style={{ fontSize: 12 }}>Nukus, Uzbekistan</Text>
        </Space>
      </footer>
    </div>
  );
};

export default memo(MyAddresses);