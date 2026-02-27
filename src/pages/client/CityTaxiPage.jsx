import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input, message, Card, Avatar, Tag, Drawer } from 'antd';
import { ArrowLeftOutlined, EnvironmentOutlined, CarOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { supabase } from '../../config/supabase';

export default function CityTaxiPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState({
    pickup_address: '',
    dropoff_address: '',
    tariff_type: 'economy',
    notes: ''
  });
  const [currentOrders, setCurrentOrders] = useState([]);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    loadUser();
    loadCurrentOrders();
    loadSavedAddresses();
  }, []);

  const loadUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data } = await supabase.from('users').select('*').eq('id', authUser.id).single();
        setUser(data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadCurrentOrders = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data } = await supabase
          .from('city_taxi_orders')
          .select('*, driver:users!driver_id(full_name, phone, avatar_url, rating)')
          .eq('client_id', authUser.id)
          .in('status', ['pending', 'accepted', 'arrived', 'in_progress'])
          .order('created_at', { ascending: false });
        setCurrentOrders(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadSavedAddresses = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data } = await supabase
          .from('saved_addresses')
          .select('*')
          .eq('user_id', authUser.id);
        setSavedAddresses(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const createOrder = async () => {
    if (!user) {
      navigate('/auth/login');
      return;
    }
    if (!orderData.pickup_address || !orderData.dropoff_address) {
      message.warning('Manzillarni to\'ldiring');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('city_taxi_orders').insert({
        client_id: user.id,
        pickup_location: 'POINT(69.2401 41.2995)',
        pickup_address: orderData.pickup_address,
        dropoff_location: 'POINT(69.2501 41.3095)',
        dropoff_address: orderData.dropoff_address,
        tariff_type: orderData.tariff_type,
        price: 15000 + Math.random() * 20000,
        status: 'pending',
        payment_method: 'cash',
        notes: orderData.notes,
        distance_km: 5 + Math.random() * 15
      });
      if (error) throw error;
      message.success('Buyurtma yaratildi!');
      setOrderData({ pickup_address: '', dropoff_address: '', tariff_type: 'economy', notes: '' });
      loadCurrentOrders();
    } catch (error) {
      message.error('Xatolik: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const tariffs = [
    { value: 'economy', label: 'Ekonom', icon: '🚗' },
    { value: 'comfort', label: 'Komfort', icon: '🚙' },
    { value: 'business', label: 'Biznes', icon: '🚘' },
    { value: 'courier', label: 'Kuryer', icon: '📦' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center">
          <button onClick={() => navigate('/client/home')} className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeftOutlined className="text-xl" />
          </button>
          <h1 className="text-xl font-bold">{t('city_taxi')}</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Card className="mb-6">
          <h2 className="text-lg font-bold mb-4">Yangi buyurtma</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2"><EnvironmentOutlined className="mr-2" />Qayerdan</label>
              <Input size="large" value={orderData.pickup_address} onChange={(e) => setOrderData({ ...orderData, pickup_address: e.target.value })} placeholder="Olib ketish manzili" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2"><EnvironmentOutlined className="mr-2" />Qayerga</label>
              <Input size="large" value={orderData.dropoff_address} onChange={(e) => setOrderData({ ...orderData, dropoff_address: e.target.value })} placeholder="Borish manzili" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2"><CarOutlined className="mr-2" />Tarif turi</label>
              <div className="grid grid-cols-4 gap-3">
                {tariffs.map(tariff => (
                  <button key={tariff.value} onClick={() => setOrderData({ ...orderData, tariff_type: tariff.value })} className={`p-4 rounded-xl border-2 transition-all ${orderData.tariff_type === tariff.value ? 'border-amber-500 bg-amber-50' : 'border-gray-200'}`}>
                    <div className="text-3xl mb-1">{tariff.icon}</div>
                    <p className="text-sm font-medium">{tariff.label}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Izoh</label>
              <Input.TextArea rows={2} value={orderData.notes} onChange={(e) => setOrderData({ ...orderData, notes: e.target.value })} placeholder="Qo'shimcha izoh" />
            </div>
            <Button type="primary" size="large" loading={loading} onClick={createOrder} className="w-full h-12 bg-amber-500 hover:bg-amber-600 border-none font-bold">
              <CarOutlined className="mr-2" />TAKSI CHAQIRISH
            </Button>
          </div>
        </Card>

        {currentOrders.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Joriy buyurtmalar</h2>
            {currentOrders.map(order => (
              <Card key={order.id}>
                <div className="flex justify-between">
                  <div className="flex-1">
                    <Tag color="blue">{order.status}</Tag>
                    <Tag color="green">{order.tariff_type}</Tag>
                    <div className="space-y-2 mt-3 text-sm">
                      <p><EnvironmentOutlined className="mr-2 text-green-500" />{order.pickup_address}</p>
                      <p><EnvironmentOutlined className="mr-2 text-red-500" />{order.dropoff_address}</p>
                      <p className="text-gray-600"><ClockCircleOutlined className="mr-2" />{new Date(order.created_at).toLocaleString()}</p>
                    </div>
                    {order.driver && (
                      <div className="flex items-center space-x-3 mt-4 p-3 bg-gray-50 rounded-lg">
                        <Avatar src={order.driver.avatar_url} icon={<UserOutlined />} size={40} />
                        <div>
                          <p className="font-bold">{order.driver.full_name}</p>
                          <p className="text-sm text-gray-600">⭐ {order.driver.rating?.toFixed(1)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-2xl font-bold text-amber-600">{order.price?.toLocaleString()} so'm</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
