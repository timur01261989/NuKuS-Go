import React, { useState, useEffect } from "react";
import { 
  Button, Input, Form, List, Typography, Card, 
  message, Row, Col, InputNumber, Skeleton, Empty, Tag, Select 
} from "antd";
import { 
  ArrowLeftOutlined, EnvironmentOutlined, 
  ClockCircleOutlined, ShopOutlined, 
  CheckCircleOutlined, DeploymentUnitOutlined 
} from "@ant-design/icons";
import { supabase } from "../../pages/supabase"; 

const { Title, Text } = Typography;
const { Option } = Select;

export default function ClientFreight({ onBack }) {
  const [loading, setLoading] = useState(false);
  const [myOrders, setMyOrders] = useState([]);
  const [form] = Form.useForm();

  // 1. Mening yuk buyurtmalarimni yuklash
  useEffect(() => {
    fetchMyOrders();
  }, []);

  const fetchMyOrders = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        const { data } = await supabase
          .from('orders')
          .select('*')
          .eq('client_id', user.id)
          .eq('service_type', 'freight') // <--- FAQAT YUK TASHISH ZAKAZLARI
          .order('created_at', { ascending: false });

        if (data) setMyOrders(data);
    }
    setLoading(false);
  };

  // 2. Yangi yuk buyurtmasini yaratish
  const onFinish = async (values) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
          message.error("Iltimos, avval tizimga kiring");
          return;
      }

      // Yuk turi va mashina turini birlashtirib "item_description" ga yozamiz
      // Chunki bazada alohida 'truck_type' ustuni ochmagan edik (agar xohlasangiz ochish mumkin)
      const fullDescription = `[${values.truck}] ${values.description}`;

      const { error } = await supabase
        .from('orders')
        .insert([{
          client_id: user.id,
          service_type: 'freight', // <--- MUHIM: Xizmat turi
          status: 'pending',

          pickup_location: values.from, // Qayerdan yuklanadi
          dropoff_location: values.to,  // Qayerga tushiriladi
          price: values.price,          // Taklif narxi

          scheduled_time: values.time,  // Qachon
          item_description: fullDescription // Yuk haqida to'liq ma'lumot
        }]);

      if (error) throw error;

      message.success("Yuk e'lon qilindi!");
      form.resetFields();
      fetchMyOrders(); // Ro'yxatni yangilash

    } catch (err) {
      console.error(err);
      message.error("Xatolik: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const btnTouchProps = {
    onMouseDown: (e) => e.currentTarget.style.transform = "scale(0.97)",
    onMouseUp: (e) => e.currentTarget.style.transform = "scale(1)",
    onTouchStart: (e) => e.currentTarget.style.transform = "scale(0.97)",
    onTouchEnd: (e) => e.currentTarget.style.transform = "scale(1)",
    style: { transition: "transform 0.1s" }
  };

  return (
    <div style={{ padding: "15px", background: "#fff7e6", minHeight: "100vh", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

      {/* HEADER (To'q sariq uslubda) */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 25 }}>
        <Button 
          shape="circle" size="large" icon={<ArrowLeftOutlined />} onClick={onBack} 
          {...btnTouchProps}
          style={{ border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', background: '#fff', color: '#fa541c' }}
        />
        <Title level={4} style={{ margin: "0 0 0 15px", fontWeight: 800, color: "#fa541c" }}>Yuk tashish</Title>
      </div>

      {/* FORMA: YANGI BUYURTMA */}
      <Card style={{ borderRadius: 20, boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: 25, border: 'none' }}>
         <Title level={5} style={{ marginTop: 0, marginBottom: 15, display: 'flex', alignItems: 'center', gap: 8, color: '#fa541c' }}>
            <ShopOutlined />
            Yuk ma'lumotlari
         </Title>

         <Form form={form} layout="vertical" onFinish={onFinish}>

            {/* MASHINA TURI */}
            <Form.Item name="truck" label="Mashina turi" rules={[{ required: true, message: 'Tanlang' }]}>
                <Select size="large" placeholder="Masalan: Labo" style={{ borderRadius: 12 }}>
                    <Option value="Labo">Labo (Kichik yuk)</Option>
                    <Option value="Damas">Damas (Kichik yuk)</Option>
                    <Option value="Gazel">Gazel (O'rta yuk)</Option>
                    <Option value="Isuzu">Isuzu (Katta yuk)</Option>
                    <Option value="Fura">Fura (Juda katta)</Option>
                </Select>
            </Form.Item>

            <Row gutter={10}>
                <Col span={12}>
                    <Form.Item name="from" label="Yuklash manzili" rules={[{ required: true, message: 'Kiriting' }]}>
                        <Input prefix={<EnvironmentOutlined />} placeholder="Qo'yliq bozori" size="large" style={{ borderRadius: 12 }} />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="to" label="Tushirish manzili" rules={[{ required: true, message: 'Kiriting' }]}>
                        <Input prefix={<EnvironmentOutlined />} placeholder="Chilonzor" size="large" style={{ borderRadius: 12 }} />
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item name="description" label="Yuk tavsifi" rules={[{ required: true, message: 'Yuk nima ekanligini yozing' }]}>
                <Input placeholder="Masalan: 20 qop sement, og'irligi 1 tonna" size="large" style={{ borderRadius: 12 }} />
            </Form.Item>

            <Row gutter={10}>
                <Col span={12}>
                    <Form.Item name="time" label="Vaqti" rules={[{ required: true, message: 'Vaqtni kiriting' }]}>
                        <Input prefix={<ClockCircleOutlined />} placeholder="Hozir" size="large" style={{ borderRadius: 12 }} />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="price" label="Narx (so'm)" rules={[{ required: true, message: 'Narxni kiriting' }]}>
                         <InputNumber 
                            style={{ width: '100%', borderRadius: 12 }} 
                            size="large"
                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value.replace(/\$\s?|(,*)/g, '')}
                            placeholder="50,000"
                        />
                    </Form.Item>
                </Col>
            </Row>

            <Button 
                type="primary" htmlType="submit" block size="large" loading={loading}
                {...btnTouchProps}
                style={{ borderRadius: 14, height: 50, fontWeight: 700, background: '#fa541c', border: 'none', ...btnTouchProps.style }}
            >
                Yuk mashina chaqirish
            </Button>
         </Form>
      </Card>

      {/* MENING BUYURTMALARIM */}
      <Title level={5} style={{ margin: "0 0 15px 5px", color: "#fa541c" }}>Mening yuklarim</Title>

      {loading && myOrders.length === 0 ? (
          <Skeleton active />
      ) : myOrders.length === 0 ? (
          <Empty description="Yuk buyurtmalari yo'q" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
          <List
            dataSource={myOrders}
            renderItem={item => (
                <Card style={{ borderRadius: 16, marginBottom: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                    <div style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Tag color="orange" icon={<DeploymentUnitOutlined />}>
                                {item.item_description?.split(']')[0]?.replace('[', '') || 'Yuk'}
                            </Tag>
                            <Text strong style={{ color: '#fa541c', fontSize: 16 }}>
                                {parseInt(item.price).toLocaleString()} so'm
                            </Text>
                        </div>
                        <Text style={{ fontSize: 15, display: 'block', marginTop: 5 }}>
                            {item.pickup_location} ➝ {item.dropoff_location}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                             {item.item_description?.split(']')[1] || item.item_description}
                        </Text>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            {item.status === 'pending' && <ClockCircleOutlined style={{ color: 'orange' }} />}
                            {item.status === 'accepted' && <CheckCircleOutlined style={{ color: 'green' }} />}
                            <Text type="secondary" style={{ fontSize: 13 }}>
                                {item.status === 'pending' ? 'Mashina qidirilmoqda...' : 'Haydovchi qabul qildi!'}
                            </Text>
                        </div>
                        {item.status === 'pending' && (
                            <Button size="small" danger type="text">Bekor qilish</Button>
                        )}
                    </div>
                </Card>
            )}
          />
      )}
    </div>
  );
}