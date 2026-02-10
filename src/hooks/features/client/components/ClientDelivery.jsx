import React, { useState, useEffect } from "react";
import { 
  Button, Input, Form, List, Typography, Card, 
  message, Row, Col, InputNumber, Skeleton, Empty, Tag, Radio 
} from "antd";
import { 
  ArrowLeftOutlined, EnvironmentOutlined, 
  ClockCircleOutlined, RocketOutlined, 
  CheckCircleOutlined, GiftOutlined 
} from "@ant-design/icons";
import { supabase } from "../../pages/supabase"; 

const { Title, Text } = Typography;

export default function ClientDelivery({ onBack }) {
  const [loading, setLoading] = useState(false);
  const [myOrders, setMyOrders] = useState([]);
  const [form] = Form.useForm();

  // 1. Mening pochta buyurtmalarimni yuklash
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
          .eq('service_type', 'delivery') // <--- FAQAT ELTISH ZAKAZLARI
          .order('created_at', { ascending: false });

        if (data) setMyOrders(data);
    }
    setLoading(false);
  };

  // 2. Yangi pochta buyurtmasini yaratish
  const onFinish = async (values) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
          message.error("Iltimos, avval tizimga kiring");
          return;
      }

      // Pochta turi va og'irligini birlashtiramiz
      const fullDescription = `[${values.packageType}] ${values.description}`;

      const { error } = await supabase
        .from('orders')
        .insert([{
          client_id: user.id,
          service_type: 'delivery', // <--- MUHIM: Xizmat turi
          status: 'pending',

          pickup_location: values.from, // Qayerdan oladi
          dropoff_location: values.to,  // Qayerga tashlaydi
          price: values.price,          // Taklif narxi

          scheduled_time: values.time,  // Qachon
          item_description: fullDescription // Nima narsa ekanligi
        }]);

      if (error) throw error;

      message.success("Kuryer chaqirildi!");
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
    <div style={{ padding: "15px", background: "#f9f0ff", minHeight: "100vh", fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>

      {/* HEADER (Binafsha uslubda) */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 25 }}>
        <Button 
          shape="circle" size="large" icon={<ArrowLeftOutlined />} onClick={onBack} 
          {...btnTouchProps}
          style={{ border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', background: '#fff', color: '#722ed1' }}
        />
        <Title level={4} style={{ margin: "0 0 0 15px", fontWeight: 800, color: "#722ed1" }}>Eltish xizmati</Title>
      </div>

      {/* FORMA: YANGI BUYURTMA */}
      <Card style={{ borderRadius: 20, boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: 25, border: 'none' }}>
         <Title level={5} style={{ marginTop: 0, marginBottom: 15, display: 'flex', alignItems: 'center', gap: 8, color: '#722ed1' }}>
            <RocketOutlined />
            Posilka ma'lumotlari
         </Title>

         <Form form={form} layout="vertical" onFinish={onFinish}>

            {/* POSILKA TURI */}
            <Form.Item name="packageType" label="Nima yuborasiz?" rules={[{ required: true, message: 'Tanlang' }]}>
                <Radio.Group buttonStyle="solid" style={{ width: '100%', display: 'flex', gap: 5 }}>
                    <Radio.Button value="Hujjat" style={{ flex: 1, textAlign: 'center', borderRadius: 8 }}>Hujjat</Radio.Button>
                    <Radio.Button value="Kichik yuk" style={{ flex: 1, textAlign: 'center', borderRadius: 8 }}>Kichik yuk</Radio.Button>
                    <Radio.Button value="Sovg'a" style={{ flex: 1, textAlign: 'center', borderRadius: 8 }}>Sovg'a</Radio.Button>
                </Radio.Group>
            </Form.Item>

            <Row gutter={10}>
                <Col span={12}>
                    <Form.Item name="from" label="Qayerdan olish kerak" rules={[{ required: true, message: 'Kiriting' }]}>
                        <Input prefix={<EnvironmentOutlined />} placeholder="Ofisdan" size="large" style={{ borderRadius: 12 }} />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="to" label="Qayerga eltish kerak" rules={[{ required: true, message: 'Kiriting' }]}>
                        <Input prefix={<EnvironmentOutlined />} placeholder="Uyga" size="large" style={{ borderRadius: 12 }} />
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item name="description" label="Izoh (Nima bu?)" rules={[{ required: true, message: 'Yozing' }]}>
                <Input placeholder="Masalan: Kalit, Pasport yoki gullar..." size="large" style={{ borderRadius: 12 }} />
            </Form.Item>

            <Row gutter={10}>
                <Col span={12}>
                    <Form.Item name="time" label="Vaqti" rules={[{ required: true, message: 'Vaqtni kiriting' }]}>
                        <Input prefix={<ClockCircleOutlined />} placeholder="Tezda" size="large" style={{ borderRadius: 12 }} />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="price" label="Narx (so'm)" rules={[{ required: true, message: 'Narxni kiriting' }]}>
                         <InputNumber 
                            style={{ width: '100%', borderRadius: 12 }} 
                            size="large"
                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value.replace(/\$\s?|(,*)/g, '')}
                            placeholder="15,000"
                        />
                    </Form.Item>
                </Col>
            </Row>

            <Button 
                type="primary" htmlType="submit" block size="large" loading={loading}
                {...btnTouchProps}
                style={{ borderRadius: 14, height: 50, fontWeight: 700, background: '#722ed1', border: 'none', ...btnTouchProps.style }}
            >
                Kuryer chaqirish
            </Button>
         </Form>
      </Card>

      {/* MENING BUYURTMALARIM */}
      <Title level={5} style={{ margin: "0 0 15px 5px", color: "#722ed1" }}>Mening posilkalarim</Title>

      {loading && myOrders.length === 0 ? (
          <Skeleton active />
      ) : myOrders.length === 0 ? (
          <Empty description="Hozircha posilkalar yo'q" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
          <List
            dataSource={myOrders}
            renderItem={item => (
                <Card style={{ borderRadius: 16, marginBottom: 12, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                    <div style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Tag color="purple" icon={<GiftOutlined />}>
                                {item.item_description?.split(']')[0]?.replace('[', '') || 'Posilka'}
                            </Tag>
                            <Text strong style={{ color: '#722ed1', fontSize: 16 }}>
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
                                {item.status === 'pending' ? 'Kuryer qidirilmoqda...' : 'Kuryer yo\'lda!'}
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