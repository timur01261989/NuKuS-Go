import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, message } from 'antd';
import { ArrowLeftOutlined, LogoutOutlined } from '@ant-design/icons';
import { supabase } from '@config/supabase';

export default function DriverSettingsPage() {
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    message.success('Tizimdan chiqdingiz');
    navigate('/auth/login');
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center">
          <button onClick={() => navigate('/driver/home')} className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeftOutlined className="text-xl" />
          </button>
          <h1 className="text-xl font-bold">Sozlamalar</h1>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card>
          <h2 className="text-lg font-bold mb-4">Profil sozlamalari</h2>
          <p className="text-gray-600 mb-4">Bu sahifa to'liq ishlab chiqilmoqda...</p>
          <Button danger icon={<LogoutOutlined />} onClick={handleLogout}>
            Chiqish
          </Button>
        </Card>
      </div>
    </div>
  );
}
