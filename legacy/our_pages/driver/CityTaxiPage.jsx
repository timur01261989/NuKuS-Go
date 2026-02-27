import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Switch } from 'antd';
import { ArrowLeftOutlined, CarOutlined } from '@ant-design/icons';

export default function DriverCityTaxiPage() {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = React.useState(false);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate('/driver/home')} className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeftOutlined className="text-xl" />
            </button>
            <h1 className="text-xl font-bold">Shahar ichida taksi</h1>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium">{isOnline ? 'Onlayn' : 'Offlayn'}</span>
            <Switch 
              checked={isOnline} 
              onChange={setIsOnline}
              checkedChildren="ON"
              unCheckedChildren="OFF"
            />
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Card>
          <div className="text-center py-12">
            <CarOutlined className="text-6xl text-gray-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">
              {isOnline ? 'Buyurtmalar kutilmoqda...' : 'Offlaynsiz'}
            </h2>
            <p className="text-gray-600">
              {isOnline 
                ? 'Buyurtma kelishi bilan sizga xabar beriladi' 
                : 'Buyurtma qabul qilish uchun onlayn bo\'ling'}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
