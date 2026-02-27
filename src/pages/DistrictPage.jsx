import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Select, DatePicker, TimePicker, InputNumber, message, Card, Tag } from 'antd';
import { ArrowLeftOutlined, EnvironmentOutlined, CarOutlined } from '@ant-design/icons';
import { supabase } from '@config/supabase';
import dayjs from 'dayjs';

export default function DistrictPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [searchData, setSearchData] = useState({
    region_id: null,
    from_district_id: null,
    to_district_id: null,
    departure_date: null,
    seats_needed: 1
  });

  useEffect(() => {
    loadUser();
    loadRegions();
  }, []);

  const loadUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const { data } = await supabase.from('users').select('*').eq('id', authUser.id).single();
      setUser(data);
    }
  };

  const loadRegions = async () => {
    const { data } = await supabase.from('regions').select('*').order('name_uz_latn');
    setRegions(data || []);
  };

  const loadDistricts = async (regionId) => {
    const { data } = await supabase.from('districts').select('*').eq('region_id', regionId).order('name_uz_latn');
    setDistricts(data || []);
  };

  const searchRoutes = async () => {
    if (!searchData.region_id || !searchData.from_district_id) {
      message.warning('Hudud va tumanni tanlang');
      return;
    }
    setLoading(true);
    try {
      let query = supabase
        .from('district_routes')
        .select(`
          *,
          driver:users!driver_id(full_name, phone, avatar_url, rating),
          region:regions!region_id(name_uz_latn),
          from_district:districts!from_district_id(name_uz_latn),
          to_district:districts!to_district_id(name_uz_latn)
        `)
        .eq('status', 'active')
        .eq('region_id', searchData.region_id)
        .eq('from_district_id', searchData.from_district_id)
        .gte('available_seats', searchData.seats_needed);

      if (searchData.to_district_id) {
        query = query.eq('to_district_id', searchData.to_district_id);
      }
      if (searchData.departure_date) {
        query = query.eq('departure_date', searchData.departure_date);
      }

      const { data } = await query.order('departure_date').order('departure_time');
      setRoutes(data || []);
      if (!data || data.length === 0) message.info('Reyslar topilmadi');
    } catch (error) {
      message.error('Qidiruvda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const bookRoute = async (routeId, seats) => {
    if (!user) {
      navigate('/auth/login');
      return;
    }
    try {
      const route = routes.find(r => r.id === routeId);
      const { error } = await supabase.from('district_bookings').insert({
        route_id: routeId,
        client_id: user.id,
        seats_booked: seats,
        total_price: route.price_per_seat * seats,
        status: 'pending'
      });
      if (error) throw error;
      message.success('Buyurtma qabul qilindi!');
      searchRoutes();
    } catch (error) {
      message.error('Buyurtmada xatolik');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center">
          <button onClick={() => navigate('/client/home')} className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeftOutlined className="text-xl" />
          </button>
          <h1 className="text-xl font-bold">{t('district')}</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Hudud</label>
              <Select size="large" className="w-full" value={searchData.region_id} onChange={(v) => { setSearchData({ ...searchData, region_id: v, from_district_id: null, to_district_id: null }); loadDistricts(v); }} placeholder="Hudud tanlang">
                {regions.map(r => <Select.Option key={r.id} value={r.id}>{r.name_uz_latn}</Select.Option>)}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Qayerdan (tuman)</label>
              <Select size="large" className="w-full" value={searchData.from_district_id} onChange={(v) => setSearchData({ ...searchData, from_district_id: v })} disabled={!searchData.region_id}>
                {districts.map(d => <Select.Option key={d.id} value={d.id}>{d.name_uz_latn}</Select.Option>)}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Qayerga (tuman)</label>
              <Select size="large" className="w-full" value={searchData.to_district_id} onChange={(v) => setSearchData({ ...searchData, to_district_id: v })} disabled={!searchData.region_id} allowClear>
                <Select.Option value={null}>Tanlash ixtiyoriy</Select.Option>
                {districts.map(d => <Select.Option key={d.id} value={d.id}>{d.name_uz_latn}</Select.Option>)}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Sana</label>
              <DatePicker size="large" className="w-full" value={searchData.departure_date ? dayjs(searchData.departure_date) : null} onChange={(date) => setSearchData({ ...searchData, departure_date: date ? date.format('YYYY-MM-DD') : null })} disabledDate={(current) => current && current < dayjs().startOf('day')} />
            </div>
          </div>
          <Button type="primary" size="large" loading={loading} onClick={searchRoutes} className="w-full mt-4 h-12 bg-amber-500 hover:bg-amber-600 border-none font-bold">
            <EnvironmentOutlined className="mr-2" />REYS IZLASH
          </Button>
        </Card>

        <div className="space-y-4">
          {routes.map(route => (
            <Card key={route.id} hoverable>
              <div className="flex justify-between">
                <div className="flex-1">
                  <p className="font-bold text-lg">{route.from_district.name_uz_latn} → {route.to_district?.name_uz_latn || 'Barcha tumanlar'}</p>
                  <p className="text-sm text-gray-600 mt-1">{route.region.name_uz_latn}</p>
                  <div className="flex items-center space-x-4 mt-3 text-sm text-gray-600">
                    <span>📅 {route.departure_date}</span>
                    <span>🕐 {route.departure_time}</span>
                    <span>💺 {route.available_seats}/{route.total_seats}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-700">Haydovchi: {route.driver.full_name}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-2xl font-bold text-amber-600">{route.price_per_seat.toLocaleString()} so'm</p>
                  <p className="text-xs text-gray-500">bir o'rindiq</p>
                  <Button type="primary" size="large" onClick={() => bookRoute(route.id, searchData.seats_needed)} className="mt-4 bg-green-500 hover:bg-green-600 border-none">BAND QILISH</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
