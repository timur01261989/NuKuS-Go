import React, { useState, useEffect } from "react";
import { 
  Card, Button, Typography, Row, Col, Select, 
  DatePicker, List, Tag, Avatar, Empty, Skeleton, message, Divider 
} from "antd";
import { 
  ArrowLeftOutlined, SearchOutlined, EnvironmentOutlined, 
  CalendarOutlined, UserOutlined, PhoneOutlined, 
  ClockCircleOutlined, CarOutlined 
} from "@ant-design/icons";
import dayjs from "dayjs";
import { supabase } from "../../../lib/supabase"; 

const { Title, Text } = Typography;
const { Option } = Select;

export default function ClientInterProvincial({ onBack }) {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  
  // Qidiruv filtrlari
  const [filterData, setFilterData] = useState({
    fromRegion: null,
    toRegion: null,
    date: dayjs().format("YYYY-MM-DD")
  });

  // Viloyatlar ro'yxati (Haydovchi tomoni bilan bir xil)
  const regionsData = [
    { name: "Toshkent shahri" }, { name: "Qoraqalpog'iston" }, { name: "Toshkent viloyati" },
    { name: "Andijon" }, { name: "Buxoro" }, { name: "Farg'ona" }, { name: "Jizzax" },
    { name: "Xorazm" }, { name: "Namangan" }, { name: "Navoiy" }, { name: "Qashqadaryo" },
    { name: "Samarqand" }, { name: "Sirdaryo" }, { name: "Surxondaryo" }
  ];

  // Dastlabki yuklanish (Hamma reyslarni ko'rsatish)
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async (isSearch = false) => {
    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          drivers (
            first_name,
            phone,
            car_model,
            car_color,
            plate_number,
            avatar_url
          )
        `)
        .eq('service_type', 'intercity') // Faqat viloyatlar aro
        .eq('status', 'pending')         // Faqat aktiv e'lonlar
        .not('driver_id', 'is', null);   // Haydovchi yaratgan bo'lishi kerak

      // Agar qidiruv tugmasi bosilgan bo'lsa, filtrlarni qo'shamiz
      if (isSearch) {
        if (filterData.fromRegion) {
          query = query.ilike('pickup_location', `%${filterData.fromRegion}%`);
        }
        if (filterData.toRegion) {
          query = query.ilike('dropoff_location', `%${filterData.toRegion}%`);
        }
        // Sana bo'yicha filtr (hozircha matn ichidan qidiradi, chunki sana alohida ustunda emas)
        // Agar siz bazaga 'scheduled_at' ustunini qo'shgan bo'lsangiz, o'shandan foydalanamiz.
        // Hozircha client_name ichidagi matndan qidiramiz (Haydovchi kodi shunday saqlagan edi)
        if (filterData.date) {
           query = query.ilike('client_name', `%${filterData.date}%`); 
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
      
      if (isSearch && data.length === 0) {
        message.info("Bu yo'nalishda hozircha reyslar yo'q");
      }

    } catch (err) {
      console.error("Xatolik:", err);
      message.error("Reyslarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const handleBook = (driverPhone) => {
    window.location.href = `tel:${driverPhone}`;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f2f5", paddingBottom: 20 }}>
      
      {/* 1. QIDIRUV PANELI */}
      <div style={{ background: "#fff", padding: "15px 15px 20px", borderRadius: "0 0 24px 24px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
          <Button shape="circle" icon={<ArrowLeftOutlined />} onClick={onBack} style={{ border: 'none', marginRight: 10 }} />
          <Title level={4} style={{ margin: 0 }}>Reysni izlash</Title>
        </div>

        <Row gutter={[10, 10]}>
          <Col span={12}>
            <Select 
              placeholder="Qayerdan" 
              size="large" 
              style={{ width: "100%" }}
              onChange={val => setFilterData({ ...filterData, fromRegion: val })}
              allowClear
            >
              {regionsData.map(r => <Option key={r.name} value={r.name}>{r.name}</Option>)}
            </Select>
          </Col>
          <Col span={12}>
            <Select 
              placeholder="Qayerga" 
              size="large" 
              style={{ width: "100%" }}
              onChange={val => setFilterData({ ...filterData, toRegion: val })}
              allowClear
            >
              {regionsData.map(r => <Option key={r.name} value={r.name}>{r.name}</Option>)}
            </Select>
          </Col>
          <Col span={16}>
            <DatePicker 
              placeholder="Sana" 
              size="large" 
              style={{ width: "100%" }}
              format="YYYY-MM-DD"
              defaultValue={dayjs()}
              onChange={(date, dateString) => setFilterData({ ...filterData, date: dateString })}
            />
          </Col>
          <Col span={8}>
            <Button 
              type="primary" 
              size="large" 
              icon={<SearchOutlined />} 
              block 
              style={{ background: "#1890ff", borderRadius: 8 }}
              onClick={() => fetchOrders(true)}
            >
              Izlash
            </Button>
          </Col>
        </Row>
      </div>

      {/* 2. REYSLAR RO'YXATI */}
      <div style={{ padding: 15 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
           <Text type="secondary" strong>Mavjud reyslar ({orders.length})</Text>
           {/* Agar barcha reyslarni qaytarmoqchi bo'lsa */}
           <Button type="link" size="small" onClick={() => fetchOrders(false)}>Hammasini ko'rish</Button>
        </div>

        {loading ? (
          [1, 2, 3].map(i => <Card key={i} style={{marginBottom: 10, borderRadius: 16}}><Skeleton active avatar paragraph={{rows: 2}} /></Card>)
        ) : orders.length === 0 ? (
          <Empty description="Hozircha reyslar topilmadi" style={{ marginTop: 50 }} />
        ) : (
          <List
            dataSource={orders}
            renderItem={item => {
              // Haydovchi ma'lumotlarini olish
              const driver = item.drivers || {};
              
              // Biz "DriverInterProvincial.jsx" da ma'lumotlarni qayerga saqlaganimizni eslaymiz:
              // client_name = "Ketish: 2024-02-14 | 09:00"
              // client_phone = "Joylar: 4 ta"
              
              const departureInfo = item.client_name || "Vaqt noma'lum";
              const seatsInfo = item.client_phone || "Joylar noma'lum";

              return (
                <Card 
                  key={item.id} 
                  hoverable 
                  style={{ marginBottom: 15, borderRadius: 20, border: 'none', boxShadow: "0 4px 10px rgba(0,0,0,0.03)" }}
                  bodyStyle={{ padding: 15 }}
                >
                  {/* Marshrut */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
                    <div style={{ flex: 1 }}>
                       <Text type="secondary" style={{ fontSize: 11 }}>Qayerdan</Text>
                       <div style={{ fontWeight: 'bold', fontSize: 15 }}>{item.pickup_location}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', padding: '0 10px' }}>
                       <ArrowLeftOutlined style={{ transform: 'rotate(180deg)', color: '#1890ff' }} />
                    </div>
                    <div style={{ flex: 1, textAlign: 'right' }}>
                       <Text type="secondary" style={{ fontSize: 11 }}>Qayerga</Text>
                       <div style={{ fontWeight: 'bold', fontSize: 15 }}>{item.dropoff_location}</div>
                    </div>
                  </div>

                  <Divider style={{ margin: "10px 0" }} />

                  {/* Vaqt va Narx */}
                  <Row gutter={[10, 10]} align="middle">
                    <Col span={12}>
                        <Tag icon={<ClockCircleOutlined />} color="blue" style={{ padding: '4px 8px', fontSize: 13 }}>
                           {departureInfo.replace("Ketish:", "").trim()}
                        </Tag>
                    </Col>
                    <Col span={12} style={{ textAlign: 'right' }}>
                        <Text style={{ fontSize: 18, fontWeight: 900, color: '#52c41a' }}>
                           {parseInt(item.price).toLocaleString()} so'm
                        </Text>
                    </Col>
                  </Row>

                  <div style={{ marginTop: 15, background: '#f9f9f9', padding: 10, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                     <Avatar size={40} icon={<UserOutlined />} src={driver.avatar_url} />
                     <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold' }}>{driver.first_name || "Haydovchi"}</div>
                        <div style={{ fontSize: 12, color: '#888' }}>
                           {driver.car_model} {driver.car_color} • {driver.plate_number}
                        </div>
                     </div>
                     <Tag color="orange">{seatsInfo}</Tag>
                  </div>

                  <Button 
                    type="primary" 
                    block 
                    icon={<PhoneOutlined />} 
                    style={{ marginTop: 15, borderRadius: 12, height: 45, background: '#000', fontWeight: 'bold' }}
                    onClick={() => handleBook(driver.phone)}
                  >
                    BOG'LANISH
                  </Button>
                </Card>
              );
            }}
          />
        )}
      </div>
    </div>
  );
}