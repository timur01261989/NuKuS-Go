import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Select, InputNumber, Input, message, Card, Tag, Avatar, Modal, Empty } from 'antd';
import { ArrowLeftOutlined, CarOutlined, SearchOutlined, FilterOutlined, PlusOutlined } from '@ant-design/icons';
import { supabase } from '../../config/supabase';

export default function AutoMarketPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    condition: null,
    fuel_type: null,
    transmission: null,
    min_price: null,
    max_price: null,
    min_year: null,
    max_year: null
  });

  useEffect(() => {
    loadUser();
    loadListings();
  }, []);

  const loadUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const { data } = await supabase.from('users').select('*').eq('id', authUser.id).single();
      setUser(data);
    }
  };

  const loadListings = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('car_listings')
        .select(`
          *,
          seller:users!seller_id(full_name, phone, avatar_url),
          region:regions!region_id(name_uz_latn),
          district:districts!district_id(name_uz_latn)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (filters.condition) query = query.eq('condition', filters.condition);
      if (filters.fuel_type) query = query.eq('fuel_type', filters.fuel_type);
      if (filters.transmission) query = query.eq('transmission', filters.transmission);
      if (filters.min_price) query = query.gte('price', filters.min_price);
      if (filters.max_price) query = query.lte('price', filters.max_price);
      if (filters.min_year) query = query.gte('year', filters.min_year);
      if (filters.max_year) query = query.lte('year', filters.max_year);

      const { data, error } = await query;
      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      message.error('Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const viewDetails = (listing) => {
    setSelectedListing(listing);
    setModalOpen(true);
    incrementViewCount(listing.id);
  };

  const incrementViewCount = async (listingId) => {
    await supabase.rpc('increment_car_view', { listing_id: listingId });
  };

  const conditions = [
    { value: 'new', label: 'Yangi', icon: '🆕' },
    { value: 'excellent', label: 'A\'lo', icon: '⭐' },
    { value: 'good', label: 'Yaxshi', icon: '👍' },
    { value: 'fair', label: 'O\'rtacha', icon: '👌' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={() => navigate('/client/home')} className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeftOutlined className="text-xl" />
            </button>
            <h1 className="text-xl font-bold">{t('auto_market')}</h1>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => message.info('E\'lon berish funksiyasi')}>
            E'lon berish
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Holati</label>
              <Select size="large" className="w-full" value={filters.condition} onChange={(v) => setFilters({ ...filters, condition: v })} allowClear>
                {conditions.map(c => <Select.Option key={c.value} value={c.value}>{c.icon} {c.label}</Select.Option>)}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Yoqilg'i</label>
              <Select size="large" className="w-full" value={filters.fuel_type} onChange={(v) => setFilters({ ...filters, fuel_type: v })} allowClear>
                <Select.Option value="petrol">⛽ Benzin</Select.Option>
                <Select.Option value="diesel">🚛 Dizel</Select.Option>
                <Select.Option value="gas">🔥 Gaz</Select.Option>
                <Select.Option value="electric">⚡ Elektr</Select.Option>
                <Select.Option value="hybrid">🔋 Gibrid</Select.Option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Uzatma</label>
              <Select size="large" className="w-full" value={filters.transmission} onChange={(v) => setFilters({ ...filters, transmission: v })} allowClear>
                <Select.Option value="manual">⚙️ Mexanik</Select.Option>
                <Select.Option value="automatic">🔄 Avtomat</Select.Option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Yil (min-max)</label>
              <div className="flex space-x-2">
                <InputNumber size="large" className="w-1/2" value={filters.min_year} onChange={(v) => setFilters({ ...filters, min_year: v })} placeholder="2000" />
                <InputNumber size="large" className="w-1/2" value={filters.max_year} onChange={(v) => setFilters({ ...filters, max_year: v })} placeholder="2025" />
              </div>
            </div>
          </div>
          <Button type="primary" size="large" loading={loading} onClick={loadListings} className="w-full mt-4 h-12 bg-amber-500 hover:bg-amber-600 border-none font-bold">
            <SearchOutlined className="mr-2" />QIDIRISH
          </Button>
        </Card>

        {/* Listings */}
        {listings.length === 0 ? (
          <Empty description="Hech narsa topilmadi" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map(listing => (
              <Card
                key={listing.id}
                hoverable
                onClick={() => viewDetails(listing)}
                cover={
                  <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <CarOutlined className="text-6xl text-gray-400" />
                  </div>
                }
              >
                <Card.Meta
                  title={<div className="flex justify-between items-start">
                    <span>{listing.brand} {listing.model}</span>
                    <Tag color="green">{listing.year}</Tag>
                  </div>}
                  description={
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-amber-600">${listing.price.toLocaleString()}</p>
                      <div className="flex flex-wrap gap-2">
                        <Tag>{listing.fuel_type}</Tag>
                        <Tag>{listing.transmission}</Tag>
                        {listing.mileage && <Tag>🛣️ {listing.mileage.toLocaleString()} km</Tag>}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        📍 {listing.region?.name_uz_latn}{listing.district && `, ${listing.district.name_uz_latn}`}
                      </p>
                      <p className="text-xs text-gray-500">👁️ {listing.view_count || 0} ko'rishlar</p>
                    </div>
                  }
                />
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      <Modal
        title={selectedListing && `${selectedListing.brand} ${selectedListing.model} (${selectedListing.year})`}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={700}
      >
        {selectedListing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Narxi</p>
                <p className="text-2xl font-bold text-amber-600">${selectedListing.price.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Holati</p>
                <p className="font-medium">{selectedListing.condition}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Yoqilg'i</p>
                <p className="font-medium">{selectedListing.fuel_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Uzatma</p>
                <p className="font-medium">{selectedListing.transmission}</p>
              </div>
              {selectedListing.mileage && (
                <div>
                  <p className="text-sm text-gray-500">Yurgan</p>
                  <p className="font-medium">{selectedListing.mileage.toLocaleString()} km</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Rangi</p>
                <p className="font-medium">{selectedListing.color}</p>
              </div>
            </div>

            {selectedListing.description && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Tavsif</p>
                <p>{selectedListing.description}</p>
              </div>
            )}

            {selectedListing.features && selectedListing.features.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Xususiyatlari</p>
                <div className="flex flex-wrap gap-2">
                  {selectedListing.features.map((feature, idx) => (
                    <Tag key={idx} color="blue">{feature}</Tag>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500 mb-2">Sotuvchi</p>
              <div className="flex items-center space-x-3">
                <Avatar src={selectedListing.seller?.avatar_url} size={48} />
                <div>
                  <p className="font-bold">{selectedListing.seller?.full_name}</p>
                  <p className="text-sm text-gray-600">{selectedListing.seller?.phone}</p>
                </div>
              </div>
            </div>

            <Button type="primary" size="large" className="w-full mt-4 bg-green-500 hover:bg-green-600 border-none" onClick={() => message.success('Aloqa funksiyasi')}>
              Sotuvchi bilan bog'lanish
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
