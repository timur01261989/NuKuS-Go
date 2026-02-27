import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  MenuOutlined, 
  CarOutlined, 
  GlobalOutlined,
  EnvironmentOutlined,
  SendOutlined,
  ShoppingOutlined 
} from '@ant-design/icons';
import { Button, Drawer } from 'antd';
import Sidebar from '../../components/Sidebar';

export default function ClientHomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const services = [
    {
      key: 'city_taxi',
      title: t('city_taxi'),
      icon: <CarOutlined />,
      color: 'from-amber-400 to-orange-500',
      path: '/client/city-taxi'
    },
    {
      key: 'intercity',
      title: t('intercity'),
      icon: <GlobalOutlined />,
      color: 'from-blue-400 to-indigo-500',
      path: '/client/intercity'
    },
    {
      key: 'district',
      title: t('district'),
      icon: <EnvironmentOutlined />,
      color: 'from-green-400 to-emerald-500',
      path: '/client/district'
    },
    {
      key: 'delivery',
      title: t('delivery'),
      icon: <SendOutlined />,
      color: 'from-purple-400 to-pink-500',
      path: '/client/delivery'
    },
    {
      key: 'auto_market',
      title: t('auto_market'),
      icon: <ShoppingOutlined />,
      color: 'from-red-400 to-rose-500',
      path: '/client/auto-market'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MenuOutlined className="text-2xl text-gray-700" />
          </button>
          
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center transform rotate-3">
              <span className="text-white text-lg font-black">UG</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{t('app_name')}</h1>
              <p className="text-xs text-blue-600 font-medium">{t('app_slogan')}</p>
            </div>
          </div>
          
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Services Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {services.map((service) => (
            <button
              key={service.key}
              onClick={() => navigate(service.path)}
              className={`
                relative overflow-hidden rounded-2xl p-6 
                bg-gradient-to-br ${service.color}
                transform transition-all duration-300
                hover:scale-105 hover:shadow-xl
                active:scale-95
                group
              `}
            >
              <div className="relative z-10">
                <div className="text-4xl text-white mb-3 group-hover:scale-110 transition-transform">
                  {service.icon}
                </div>
                <h3 className="text-white font-bold text-sm leading-tight">
                  {service.title}
                </h3>
              </div>
              
              {/* Decorative circles */}
              <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full" />
              <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-white/10 rounded-full" />
            </button>
          ))}
        </div>

        {/* Auto Salon Section */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {t('featured_cars') || 'Tavsiya etiladigan avtomobillar'}
            </h2>
            <Button
              type="link"
              onClick={() => navigate('/client/auto-market')}
              className="text-blue-600 font-medium"
            >
              {t('view_all') || 'Barchasini ko\'rish'} →
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Featured car cards will be loaded from database */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow">
              <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                <CarOutlined className="text-6xl text-gray-400" />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-800">Toyota Camry 2023</h3>
                <p className="text-gray-600 text-sm mt-1">Yaxshi holatda</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xl font-bold text-amber-600">$25,000</span>
                  <Button type="primary" size="small" className="rounded-lg">
                    {t('view_details') || 'Batafsil'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Ads Section */}
        <section className="mt-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {t('recent_ads') || 'So\'nggi e\'lonlar'}
          </h2>
          
          <div className="bg-white rounded-2xl shadow-md p-6">
            <p className="text-gray-500 text-center py-8">
              {t('no_ads_yet') || 'Hozircha e\'lonlar yo\'q'}
            </p>
          </div>
        </section>
      </main>

      {/* Sidebar Drawer */}
      <Drawer
        placement="left"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        width={300}
        bodyStyle={{ padding: 0 }}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </Drawer>
    </div>
  );
}
