import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Select, DatePicker, TimePicker, Input, InputNumber, message, Card } from 'antd';
import { ArrowLeftOutlined, SendOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { supabase } from '../../config/supabase';
import dayjs from 'dayjs';

export default function DeliveryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [regions, setRegions] = useState([]);
  const [fromDistricts, setFromDistricts] = useState([]);
  const [toDistricts, setToDistricts] = useState([]);
  const [deliveryData, setDeliveryData] = useState({
    from_region_id: null,
    from_district_id: null,
    to_region_id: null,
    to_district_id: null,
    pickup_address: '',
    dropoff_address: '',
    departure_date: null,
    departure_time: null,
    package_description: '',
    package_weight: null,
    package_size: 'medium',
    receiver_name: '',
    receiver_phone: '',
    notes: ''
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

  const loadDistricts = async (regionId, type) => {
    const { data } = await supabase.from('districts').select('*').eq('region_id', regionId).order('name_uz_latn');
    if (type === 'from') setFromDistricts(data || []);
    else setToDistricts(data || []);
  };

  const createDeliveryRequest = async () => {
    if (!user) {
      navigate('/auth/login');
      return;
    }
    if (!deliveryData.from_region_id || !deliveryData.to_region_id || !deliveryData.pickup_address || !deliveryData.dropoff_address) {
      message.warning('Barcha majburiy maydonlarni to\'ldiring');
      return;
    }
    setLoading(true);
    try {
      // Calculate price based on distance and package size
      const basePrice = 20000;
      const sizeMultiplier = deliveryData.package_size === 'small' ? 1 : deliveryData.package_size === 'medium' ? 1.5 : 2;
      const estimatedPrice = basePrice * sizeMultiplier;

      const { error } = await supabase.from('delivery_orders').insert({
        client_id: user.id,
        from_region_id: deliveryData.from_region_id,
        from_district_id: deliveryData.from_district_id,
        to_region_id: deliveryData.to_region_id,
        to_district_id: deliveryData.to_district_id,
        pickup_location: 'POINT(69.2401 41.2995)',
        pickup_address: deliveryData.pickup_address,
        dropoff_location: 'POINT(69.2501 41.3095)',
        dropoff_address: deliveryData.dropoff_address,
        departure_date: deliveryData.departure_date,
        departure_time: deliveryData.departure_time,
        package_description: deliveryData.package_description,
        package_weight: deliveryData.package_weight,
        package_size: deliveryData.package_size,
        receiver_name: deliveryData.receiver_name,
        receiver_phone: deliveryData.receiver_phone,
        notes: deliveryData.notes,
        price: estimatedPrice,
        status: 'pending'
      });
      if (error) throw error;
      message.success('Yetkazib berish buyurtmasi yaratildi!');
      setDeliveryData({
        from_region_id: null,
        from_district_id: null,
        to_region_id: null,
        to_district_id: null,
        pickup_address: '',
        dropoff_address: '',
        departure_date: null,
        departure_time: null,
        package_description: '',
        package_weight: null,
        package_size: 'medium',
        receiver_name: '',
        receiver_phone: '',
        notes: ''
      });
    } catch (error) {
      message.error('Xatolik: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center">
          <button onClick={() => navigate('/client/home')} className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeftOutlined className="text-xl" />
          </button>
          <h1 className="text-xl font-bold">{t('delivery')}</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card>
          <h2 className="text-lg font-bold mb-4">Yetkazib berish buyurtmasi</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Qayerdan (viloyat)</label>
                <Select size="large" className="w-full" value={deliveryData.from_region_id} onChange={(v) => { setDeliveryData({ ...deliveryData, from_region_id: v, from_district_id: null }); loadDistricts(v, 'from'); }}>
                  {regions.map(r => <Select.Option key={r.id} value={r.id}>{r.name_uz_latn}</Select.Option>)}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Qayerdan (tuman)</label>
                <Select size="large" className="w-full" value={deliveryData.from_district_id} onChange={(v) => setDeliveryData({ ...deliveryData, from_district_id: v })} disabled={!deliveryData.from_region_id}>
                  {fromDistricts.map(d => <Select.Option key={d.id} value={d.id}>{d.name_uz_latn}</Select.Option>)}
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2"><EnvironmentOutlined className="mr-2" />Olib ketish manzili</label>
              <Input size="large" value={deliveryData.pickup_address} onChange={(e) => setDeliveryData({ ...deliveryData, pickup_address: e.target.value })} placeholder="To'liq manzil" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Qayerga (viloyat)</label>
                <Select size="large" className="w-full" value={deliveryData.to_region_id} onChange={(v) => { setDeliveryData({ ...deliveryData, to_region_id: v, to_district_id: null }); loadDistricts(v, 'to'); }}>
                  {regions.map(r => <Select.Option key={r.id} value={r.id}>{r.name_uz_latn}</Select.Option>)}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Qayerga (tuman)</label>
                <Select size="large" className="w-full" value={deliveryData.to_district_id} onChange={(v) => setDeliveryData({ ...deliveryData, to_district_id: v })} disabled={!deliveryData.to_region_id}>
                  {toDistricts.map(d => <Select.Option key={d.id} value={d.id}>{d.name_uz_latn}</Select.Option>)}
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2"><EnvironmentOutlined className="mr-2" />Yetkazib berish manzili</label>
              <Input size="large" value={deliveryData.dropoff_address} onChange={(e) => setDeliveryData({ ...deliveryData, dropoff_address: e.target.value })} placeholder="To'liq manzil" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Sana</label>
                <DatePicker size="large" className="w-full" value={deliveryData.departure_date ? dayjs(deliveryData.departure_date) : null} onChange={(date) => setDeliveryData({ ...deliveryData, departure_date: date ? date.format('YYYY-MM-DD') : null })} disabledDate={(current) => current && current < dayjs().startOf('day')} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Vaqt</label>
                <TimePicker size="large" className="w-full" value={deliveryData.departure_time ? dayjs(deliveryData.departure_time, 'HH:mm') : null} onChange={(time) => setDeliveryData({ ...deliveryData, departure_time: time ? time.format('HH:mm') : null })} format="HH:mm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Posilka tavsifi</label>
              <Input.TextArea rows={2} value={deliveryData.package_description} onChange={(e) => setDeliveryData({ ...deliveryData, package_description: e.target.value })} placeholder="Nima yuborilayotgani haqida" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Og'irligi (kg)</label>
                <InputNumber size="large" className="w-full" min={0} value={deliveryData.package_weight} onChange={(v) => setDeliveryData({ ...deliveryData, package_weight: v })} placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">O'lchami</label>
                <Select size="large" className="w-full" value={deliveryData.package_size} onChange={(v) => setDeliveryData({ ...deliveryData, package_size: v })}>
                  <Select.Option value="small">Kichik 📦</Select.Option>
                  <Select.Option value="medium">O'rta 📦📦</Select.Option>
                  <Select.Option value="large">Katta 📦📦📦</Select.Option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Qabul qiluvchi ismi</label>
                <Input size="large" value={deliveryData.receiver_name} onChange={(e) => setDeliveryData({ ...deliveryData, receiver_name: e.target.value })} placeholder="F.I.O" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Qabul qiluvchi telefoni</label>
                <Input size="large" prefix="+998" value={deliveryData.receiver_phone} onChange={(e) => setDeliveryData({ ...deliveryData, receiver_phone: e.target.value })} placeholder="90 123 45 67" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Qo'shimcha izoh</label>
              <Input.TextArea rows={2} value={deliveryData.notes} onChange={(e) => setDeliveryData({ ...deliveryData, notes: e.target.value })} />
            </div>

            <Button type="primary" size="large" loading={loading} onClick={createDeliveryRequest} className="w-full h-12 bg-amber-500 hover:bg-amber-600 border-none font-bold">
              <SendOutlined className="mr-2" />BUYURTMA BERISH
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
