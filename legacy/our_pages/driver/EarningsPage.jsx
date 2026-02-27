import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Statistic } from 'antd';
import { ArrowLeftOutlined, DollarOutlined } from '@ant-design/icons';

export default function DriverEarningsPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center">
          <button onClick={() => navigate('/driver/home')} className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeftOutlined className="text-xl" />
          </button>
          <h1 className="text-xl font-bold">Daromadlar</h1>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <Statistic title="Bugungi daromad" value={0} suffix="so'm" prefix={<DollarOutlined />} valueStyle={{ color: '#3f8600' }} />
          </Card>
          <Card>
            <Statistic title="Bu hafta" value={0} suffix="so'm" prefix={<DollarOutlined />} />
          </Card>
          <Card>
            <Statistic title="Bu oy" value={0} suffix="so'm" prefix={<DollarOutlined />} />
          </Card>
        </div>
      </div>
    </div>
  );
}
