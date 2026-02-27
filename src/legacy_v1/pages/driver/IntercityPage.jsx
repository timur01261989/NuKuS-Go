import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

export default function DriverIntercityPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center">
          <button onClick={() => navigate('/driver/home')} className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeftOutlined className="text-xl" />
          </button>
          <h1 className="text-xl font-bold">Viloyatlar aro reyslar</h1>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Card>
          <h2 className="text-lg font-bold mb-4">Reys yaratish</h2>
          <p className="text-gray-600">Bu sahifa to'liq ishlab chiqilmoqda...</p>
          <Button type="primary" className="mt-4 bg-amber-500 border-none">
            REYS YARATISH
          </Button>
        </Card>
      </div>
    </div>
  );
}
