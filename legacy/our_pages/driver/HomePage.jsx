import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Switch, Card, Statistic, message, Tag } from 'antd';
import { 
  MenuOutlined, DollarOutlined, CarOutlined, 
  EnvironmentOutlined, ClockCircleOutlined, CheckCircleOutlined 
} from '@ant-design/icons';
import { supabase } from '@config/supabase';

export default function DriverHomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [stats, setStats] = useState({
    today_earnings: 0,
    today_rides: 0,
    total_earnings: 0,
    total_rides: 0,
    rating: 5.0
  });
  const [servicesEnabled, setServicesEnabled] = useState({
    city_taxi: false,
    intercity: false,
    district: false,
    delivery: false
  });

  useEffect(() => {
    loadUser();
    loadStats();
  }, []);

  const loadUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: userData } = await supabase.from('users').select('*').eq('id', authUser.id).single();
        setUser(userData);

        const { data: profileData } = await supabase.from('driver_profiles').select('*').eq('user_id', authUser.id).single();
        setDriverProfile(profileData);
        
        if (profileData?.services_enabled) {
          const enabled = {};
          profileData.services_enabled.forEach(service => {
            enabled[service] = true;
          });
          setServicesEnabled(enabled);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadStats = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        // Load today's earnings
        const today = new Date().toISOString().split('T')[0];
        
        const { data: cityOrders } = await supabase
          .from('city_taxi_orders')
          .select('price')
          .eq('driver_id', authUser.id)
          .eq('status', 'completed')
          .gte('completed_at', today);
        
        const todayEarnings = cityOrders?.reduce((sum, order) => sum + (order.price || 0), 0) || 0;
        
        setStats(prev => ({
          ...prev,
          today_earnings: todayEarnings,
          today_rides: cityOrders?.length || 0
        }));
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const toggleService = async (service) => {
    const newState = !servicesEnabled[service];
    setServicesEnabled({ ...servicesEnabled, [service]: newState });

    try {
      const enabledServices = Object.keys(servicesEnabled).filter(s => 
        s === service ? newState : servicesEnabled[s]
      );

      await supabase
        .from('driver_profiles')
        .update({ services_enabled: enabledServices })
        .eq('user_id', user.id);

      message.success(newState ? 'Xizmat yoqildi' : 'Xizmat o\'chirildi');
    } catch (error) {
      message.error('Xatolik yuz berdi');
    }
  };

  const services = [
    { key: 'city_taxi', title: 'Shahar ichida taksi', icon: '🚕', color: 'green', path: '/driver/city-taxi' },
    { key: 'intercity', title: 'Viloyatlar aro', icon: '🚗', color: 'blue', path: '/driver/intercity' },
    { key: 'district', title: 'Tumanlar aro', icon: '🚙', color: 'orange', path: '/driver/district' },
    { key: 'delivery', title: 'Yetkazib berish', icon: '📦', color: 'purple', path: '/driver/delivery' }
  ];

  if (!user || !driverProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>Yuklanmoqda...</p>
      </div>
    );
  }

  if (driverProfile.status !== 'approved') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md">
          <div className="text-center">
            <ClockCircleOutlined className="text-6xl text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Tasdiqlanmoqda</h2>
            <p className="text-gray-600">
              Sizning haydovchi profilingiz admin tomonidan ko'rib chiqilmoqda. 
              Iltimos, kuting.
            </p>
            <Button type="primary" className="mt-4" onClick={() => navigate('/client/home')}>
              Mijoz sifatida davom etish
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Haydovchi paneli</h1>
              <p className="text-sm text-gray-600">{user.full_name}</p>
            </div>
            <Button icon={<MenuOutlined />} onClick={() => navigate('/driver/settings')} />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <Statistic
              title="Bugungi daromad"
              value={stats.today_earnings}
              suffix="so'm"
              valueStyle={{ color: '#3f8600' }}
              prefix={<DollarOutlined />}
            />
          </Card>
          <Card>
            <Statistic
              title="Bugungi reyslar"
              value={stats.today_rides}
              prefix={<CarOutlined />}
            />
          </Card>
          <Card>
            <Statistic
              title="Jami daromad"
              value={stats.total_earnings}
              suffix="so'm"
              prefix={<DollarOutlined />}
            />
          </Card>
          <Card>
            <Statistic
              title="Reyting"
              value={user.rating || 5.0}
              precision={1}
              prefix="⭐"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </div>

        {/* Services */}
        <Card className="mb-6">
          <h2 className="text-lg font-bold mb-4">Barcha xizmatlar</h2>
          <p className="text-sm text-gray-600 mb-4">
            Quyidagi xizmatlarni yoqing va buyurtmalarni qabul qilishni boshlang
          </p>
          <div className="space-y-4">
            {services.map(service => (
              <div key={service.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{service.icon}</div>
                  <div>
                    <p className="font-medium">{service.title}</p>
                    {servicesEnabled[service.key] && (
                      <Tag color="green" className="mt-1">Faol</Tag>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {servicesEnabled[service.key] && (
                    <Button type="link" onClick={() => navigate(service.path)}>
                      Boshqarish →
                    </Button>
                  )}
                  <Switch
                    checked={servicesEnabled[service.key]}
                    onChange={() => toggleService(service.key)}
                    checkedChildren="Yoqilgan"
                    unCheckedChildren="O'chirilgan"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card hoverable onClick={() => navigate('/driver/routes')}>
            <div className="text-center">
              <EnvironmentOutlined className="text-4xl text-blue-500 mb-2" />
              <h3 className="font-bold">Mening reyslarim</h3>
              <p className="text-sm text-gray-600">Reyslarni boshqarish</p>
            </div>
          </Card>
          <Card hoverable onClick={() => navigate('/driver/earnings')}>
            <div className="text-center">
              <DollarOutlined className="text-4xl text-green-500 mb-2" />
              <h3 className="font-bold">Daromadlar</h3>
              <p className="text-sm text-gray-600">Moliyaviy hisobot</p>
            </div>
          </Card>
          <Card hoverable onClick={() => navigate('/driver/settings')}>
            <div className="text-center">
              <CarOutlined className="text-4xl text-purple-500 mb-2" />
              <h3 className="font-bold">Sozlamalar</h3>
              <p className="text-sm text-gray-600">Profil sozlamalari</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
