import React, { useState, useEffect } from "react";
import { 
  Button, Input, Form, List, Typography, Card, 
  message, Row, Col, InputNumber, Skeleton, Empty, Tag 
} from "antd";
import { 
  ArrowLeftOutlined, EnvironmentOutlined, 
  CalendarOutlined, CheckCircleOutlined, 
  ClockCircleOutlined, GlobalOutlined 
} from "@ant-design/icons";
import { supabase } from "../../pages/supabase"; 

const { Title, Text } = Typography;

export default function ClientInterDistrict({ onBack }) {
  const [loading, setLoading] = useState(false);
  const [myOrders, setMyOrders] = useState([]);
  const [form] = Form.useForm();

  // 1. Mening buyurtmalarimni yuklash
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
          .eq('service_type', 'inter_dist') // <--- FAQAT TUMAN ZAKAZLARI
          .order('created_at', { ascending: false });

        if (data) setMyOrders(data);
    }
    setLoading(false);
  };

  // 2. Yangi buyurtma yaratish
  const onFinish = async (values) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
          message.error("Iltimos, avval tizimga kiring");
          return;
      }

      const { error } = await supabase
        .from('orders')
        .insert([{
          client_id: user.id,
          service_type: 'inter_dist', // <--- MUHIM: Xizmat turi
          status: 'pending',

          pickup_location: values.from, // Qaysi tumandan
          dropoff_location: values.to,  // Qaysi tumanga
          price: values.price,          // Narx

          passengers_count: values.passengers, 
          scheduled_time: values.time,  // "Hozir" yoki "14:00"
          item_description: values.note // Izoh
        }]);

      if (error) throw error;

      message.success("Buyurtma e'lon qilindi!");
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
    <div style={{ padding: "15px", background: "#f6ffed", minHeight: "100vh", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

      {/* HEADER (Yashil uslubda) */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 25 }}>
        <Button 
          shape="circle" size="large" icon={<ArrowLeftOutlined />} onClick={onBack} 
          {...btnTouchProps}
          style={{ border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', background: '#fff', color: '#389e0d' }}
        />
        <Title level={4} style={{ margin: "0 0 0 15px", fontWeight: 800, color: "#389e0d" }}>Tumanlar aro</Title>
      </div>

      {/* FORMA: YANGI BUYURTMA */}
      <Card style={{ borderRadius: 20, boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: 25, border: 'none' }}>
         <Title level={5} style={{ marginTop: 0, marginBottom: 15, display: 'flex', alignItems: 'center', gap: 8, color: '#389e0d' }}>
            <EnvironmentOutlined />
            Yo'nalishni tanlang
         </Title>

         <Form form={form} layout="vertical" onFinish={onFinish}>
            <Row gutter={10}>
                <Col span={12}>
                    <Form.Item name="from" label="Qaysi tumandan" rules={[{ required: true, message: 'Kiriting' }]}>
                        <Input placeholder="Xo'jayli" size="large" style={{ borderRadius: 12 }} />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="to" label="Qaysi tumanga" rules={[{ required: true, message: 'Kiriting' }]}>
                        <Input placeholder="Qo'ng'irot" size="large" style={{ borderRadius: 12 }} />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={10}>
                <Col span={12}>
                    <Form.Item name="time" label="Vaqti" rules={[{ required: true, message: 'Vaqtni kiriting' }]}>
                        <Input prefix={<ClockCircleOutlined />} placeholder="Hozir / 14:00" size="large" style={{ borderRadius: 12 }} />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="passengers" label="Odam soni" initialValue={1}>
                        <InputNumber min={1} max={4} size="large" style={{ width: '100%', borderRadius: 12 }} />
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item name="price" label="Taklif narxingiz (so'm)" rules={[{ required: true, message: 'Narxni kiriting' }]}>
                <InputNumber 
                    prefix="So'm" 
                    style={{ width: '100%', borderRadius: 12, padding: '4px 0' }} 
                    size="large"
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    placeholder="15,000"
                />
            </Form.Item>

            <Form.Item name="note" label="Izoh (ixtiyoriy)">
                <Input placeholder="Aniq manzil yoki yuk haqida..." size="large" style={{ borderRadius: 12 }} />
            </Form.Item>

            <Button 
                type="primary" htmlType="submit" block size="large" loading={loading}
                {...btnTouchProps}
                style={{ borderRadius: 14, height: 50, fontWeight: 700, background: '#389e0d', border: 'none', ...btnTouchProps.style }}
            >
                Taksi chaqirish
            </Button>
         </Form>
      </Card>

      {/* MENING AKTIV BUYURTMALARIM */}
      <Title level={5} style={{ margin: "0 0 15px 5px", color: "#389e0d" }}>Mening buyurtmalarim</Title>

      {loading && myOrders.length === 0 ? (
          <Skeleton active />
      ) : myOrders.length === 0 ? (
          <Empty description="Hozircha buyurtmalar yo'q" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
          <List
            dataSource={myOrders}
            renderItem={item => (
                <Card style={{ borderRadius: 16, marginBottom: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 10 }}>
                        <div>
                            <Text strong style={{ fontSize: 16 }}>{item.pickup_location} ➝ {item.dropoff_location}</Text>
                            <div style={{ marginTop: 4 }}>
                                <Tag color="green">{item.scheduled_time}</Tag>
                                <Tag color="orange">{item.passengers_count} kishi</Tag>
                            </div>
                        </div>
                        <Text strong style={{ color: '#389e0d', fontSize: 16 }}>
                            {parseInt(item.price).toLocaleString()}
                        </Text>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            {item.status === 'pending' && <ClockCircleOutlined style={{ color: 'orange' }} />}
                            {item.status === 'accepted' && <CheckCircleOutlined style={{ color: 'green' }} />}
                            <Text type="secondary" style={{ fontSize: 13 }}>
                                {item.status === 'pending' ? 'Haydovchi qidirilmoqda...' : 'Haydovchi topildi!'}
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