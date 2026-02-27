import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Empty } from 'antd';
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons';

export default function DriverRoutesPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate('/driver/home')} className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeftOutlined className="text-xl" />
            </button>
            <h1 className="text-xl font-bold">Mening reyslarim</h1>
          </div>
          <Button type="primary" icon={<PlusOutlined />} className="bg-amber-500 border-none">
            Yangi reys
          </Button>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Empty description="Reyslar mavjud emas" />
      </div>
    </div>
  );
}
