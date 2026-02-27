import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Button, Select, DatePicker, InputNumber, 
  Checkbox, message, Card, Tag, Avatar, Drawer, Empty
} from 'antd';
import {
  ArrowLeftOutlined, UserOutlined, CarOutlined, 
  EnvironmentOutlined, ClockCircleOutlined, CalendarOutlined
} from '@ant-design/icons';
import { supabase } from '../../config/supabase';
import dayjs from 'dayjs';

const { Option } = Select;

export default function IntercityPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [regions, setRegions] = useState([]);
  const [fromDistricts, setFromDistricts] = useState([]);
  const [toDistricts, setToDistricts] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [searchData, setSearchData] = useState({
    from_region_id: null,
    from_district_id: null,
    to_region_id: null,
    to_district_id: null,
    departure_date: null,
    seats_needed: 1
  });

  const [bookingData, setBookingData] = useState({
    seats_booked: 1,
    is_full_car: false,
    pickup_from_home: false,
    delivery_to_home: false
  });

  useEffect(() => {
    loadUser();
    loadRegions();
  }, []);

  const loadUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();
        setUser(data);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadRegions = async () => {
    try {
      const { data, error } = await supabase
        .from('regions')
        .select('*')
        .order('name_uz_latn');
      
      if (error) throw error;
      setRegions(data);
    } catch (error) {
      console.error('Error loading regions:', error);
    }
  };

  const loadDistricts = async (regionId, type) => {
    try {
      const { data, error } = await supabase
        .from('districts')
        .select('*')
        .eq('region_id', regionId)
        .order('name_uz_latn');
      
      if (error) throw error;
      
      if (type === 'from') {
        setFromDistricts(data);
      } else {
        setToDistricts(data);
      }
    } catch (error) {
      console.error('Error loading districts:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchData.from_region_id || !searchData.to_region_id) {
      message.warning(t('select_regions') || 'Viloyatlarni tanlang');
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('intercity_routes')
        .select(`
          *,
          driver:users!driver_id(id, full_name, phone, avatar_url, rating),
          from_region:regions!from_region_id(name_uz_latn, name_ru),
          to_region:regions!to_region_id(name_uz_latn, name_ru),
          from_district:districts!from_district_id(name_uz_latn, name_ru),
          to_district:districts!to_district_id(name_uz_latn, name_ru)
        `)
        .eq('status', 'active')
        .gte('available_seats', searchData.seats_needed)
        .eq('from_region_id', searchData.from_region_id)
        .eq('to_region_id', searchData.to_region_id);

      if (searchData.from_district_id) {
        query = query.eq('from_district_id', searchData.from_district_id);
      }

      if (searchData.to_district_id) {
        query = query.eq('to_district_id', searchData.to_district_id);
      }

      if (searchData.departure_date) {
        query = query.eq('departure_date', searchData.departure_date);
      }

      const { data, error } = await query.order('departure_date').order('departure_time');

      if (error) throw error;
      setRoutes(data);

      if (data.length === 0) {
        message.info(t('no_routes_found') || 'Reyslar topilmadi');
      }
    } catch (error) {
      console.error('Error searching routes:', error);
      message.error(t('search_error') || 'Qidiruvda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleBookRoute = (route) => {
    setSelectedRoute(route);
    setBookingData({
      ...bookingData,
      seats_booked: Math.min(searchData.seats_needed, route.available_seats)
    });
    setDrawerOpen(true);
  };

  const submitBooking = async () => {
    if (!user) {
      message.warning(t('login_required') || 'Tizimga kirish kerak');
      navigate('/auth/login');
      return;
    }

    setLoading(true);
    try {
      const totalPrice = bookingData.is_full_car 
        ? selectedRoute.full_car_price 
        : (selectedRoute.price_per_seat * bookingData.seats_booked);

      const finalPrice = totalPrice + 
        (bookingData.pickup_from_home ? (selectedRoute.pickup_from_home_price || 0) : 0) +
        (bookingData.delivery_to_home ? (selectedRoute.delivery_to_home_price || 0) : 0);

      const { data, error } = await supabase
        .from('intercity_bookings')
        .insert({
          route_id: selectedRoute.id,
          client_id: user.id,
          seats_booked: bookingData.is_full_car ? selectedRoute.total_seats : bookingData.seats_booked,
          is_full_car: bookingData.is_full_car,
          pickup_from_home: bookingData.pickup_from_home,
          delivery_to_home: bookingData.delivery_to_home,
          total_price: finalPrice,
          status: 'pending',
          payment_status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('intercity_routes')
        .update({
          available_seats: bookingData.is_full_car ? 0 : selectedRoute.available_seats - bookingData.seats_booked,
          status: bookingData.is_full_car || (selectedRoute.available_seats - bookingData.seats_booked === 0) ? 'full' : 'active'
        })
        .eq('id', selectedRoute.id);

      message.success(t('booking_success') || 'Buyurtma muvaffaqiyatli!');
      setDrawerOpen(false);
      handleSearch();
    } catch (error) {
      console.error('Error booking route:', error);
      message.error(t('booking_error') || 'Buyurtmada xatolik');
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
          <h1 className="text-xl font-bold">{t('intercity')}</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('from_region') || 'Qayerdan (viloyat)'}</label>
              <Select
                size="large"
                placeholder={t('select_region')}
                className="w-full"
                value={searchData.from_region_id}
                onChange={(value) => {
                  setSearchData({ ...searchData, from_region_id: value, from_district_id: null });
                  loadDistricts(value, 'from');
                }}
              >
                {regions.map(r => (
                  <Option key={r.id} value={r.id}>{r.name_uz_latn}</Option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('from_district') || 'Qayerdan (tuman)'}</label>
              <Select
                size="large"
                placeholder={t('select_district')}
                className="w-full"
                value={searchData.from_district_id}
                onChange={(value) => setSearchData({ ...searchData, from_district_id: value })}
                disabled={!searchData.from_region_id}
                allowClear
              >
                <Option value={null}>{t('any_district') || 'Tuman tanlanmagan'}</Option>
                {fromDistricts.map(d => (
                  <Option key={d.id} value={d.id}>{d.name_uz_latn}</Option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('to_region') || 'Qayerga (viloyat)'}</label>
              <Select
                size="large"
                placeholder={t('select_region')}
                className="w-full"
                value={searchData.to_region_id}
                onChange={(value) => {
                  setSearchData({ ...searchData, to_region_id: value, to_district_id: null });
                  loadDistricts(value, 'to');
                }}
              >
                {regions.map(r => (
                  <Option key={r.id} value={r.id}>{r.name_uz_latn}</Option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('to_district') || 'Qayerga (tuman)'}</label>
              <Select
                size="large"
                placeholder={t('select_district')}
                className="w-full"
                value={searchData.to_district_id}
                onChange={(value) => setSearchData({ ...searchData, to_district_id: value })}
                disabled={!searchData.to_region_id}
                allowClear
              >
                <Option value={null}>{t('any_district') || 'Tuman tanlanmagan'}</Option>
                {toDistricts.map(d => (
                  <Option key={d.id} value={d.id}>{d.name_uz_latn}</Option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('departure_date') || 'Sana'}</label>
              <DatePicker
                size="large"
                className="w-full"
                value={searchData.departure_date ? dayjs(searchData.departure_date) : null}
                onChange={(date) => setSearchData({ ...searchData, departure_date: date ? date.format('YYYY-MM-DD') : null })}
                disabledDate={(current) => current && current < dayjs().startOf('day')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('seats_needed') || 'O\'rindiqlar'}</label>
              <InputNumber
                size="large"
                min={1}
                max={10}
                className="w-full"
                value={searchData.seats_needed}
                onChange={(value) => setSearchData({ ...searchData, seats_needed: value })}
              />
            </div>
          </div>

          <Button
            type="primary"
            size="large"
            loading={loading}
            onClick={handleSearch}
            className="w-full mt-4 h-12 bg-amber-500 hover:bg-amber-600 border-none font-bold"
          >
            <EnvironmentOutlined className="mr-2" />
            {t('search_route') || 'REYS IZLASH'}
          </Button>
        </Card>

        {routes.length === 0 ? (
          <Empty description={t('no_routes') || 'Reyslar topilmadi'} />
        ) : (
          <div className="space-y-4">
            {routes.map((route) => (
              <Card key={route.id} hoverable>
                <div className="flex justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <Avatar src={route.driver.avatar_url} icon={<UserOutlined />} size={48} />
                      <div>
                        <p className="font-bold">{route.driver.full_name}</p>
                        <span className="text-sm text-gray-600">⭐ {route.driver.rating?.toFixed(1) || '5.0'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">{t('from')}</p>
                        <p className="font-medium">{route.from_region.name_uz_latn}</p>
                        {route.from_district && <p className="text-sm text-gray-600">{route.from_district.name_uz_latn}</p>}
                      </div>
                      <div className="text-center">
                        <CarOutlined className="text-2xl text-amber-500" />
                        <p className="text-xs text-gray-500 mt-1">{route.available_seats}/{route.total_seats} {t('seats')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{t('to')}</p>
                        <p className="font-medium">{route.to_region.name_uz_latn}</p>
                        {route.to_district && <p className="text-sm text-gray-600">{route.to_district.name_uz_latn}</p>}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 mt-4 text-sm text-gray-600">
                      <span><CalendarOutlined /> {route.departure_date}</span>
                      <span><ClockCircleOutlined /> {route.departure_time}</span>
                    </div>

                    {route.car_features && route.car_features.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {route.car_features.map((feature, idx) => (
                          <Tag key={idx} color="blue">{feature}</Tag>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-right ml-4">
                    <p className="text-2xl font-bold text-amber-600">{route.price_per_seat.toLocaleString()} so'm</p>
                    <p className="text-xs text-gray-500">{t('per_seat')}</p>
                    {route.full_car_price && (
                      <p className="text-sm text-gray-600 mt-1">{t('full_car')}: {route.full_car_price.toLocaleString()} so'm</p>
                    )}
                    <Button
                      type="primary"
                      size="large"
                      onClick={() => handleBookRoute(route)}
                      className="mt-4 bg-green-500 hover:bg-green-600 border-none"
                    >
                      {t('book') || 'BAND QILISH'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Drawer
        title={t('booking_details') || 'Buyurtma tafsilotlari'}
        placement="right"
        width={400}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {selectedRoute && (
          <div className="space-y-4">
            <Checkbox
              checked={bookingData.is_full_car}
              onChange={(e) => setBookingData({ ...bookingData, is_full_car: e.target.checked })}
            >
              {t('book_full_car') || 'Butun mashinani band qilish'}
            </Checkbox>

            {!bookingData.is_full_car && (
              <div>
                <label className="block text-sm font-medium mb-2">{t('seats_to_book')}</label>
                <InputNumber
                  min={1}
                  max={selectedRoute.available_seats}
                  value={bookingData.seats_booked}
                  onChange={(value) => setBookingData({ ...bookingData, seats_booked: value })}
                  className="w-full"
                />
              </div>
            )}

            <Checkbox
              checked={bookingData.pickup_from_home}
              onChange={(e) => setBookingData({ ...bookingData, pickup_from_home: e.target.checked })}
            >
              {t('pickup_from_home') || 'Uydan olib ketish'} 
              {selectedRoute.pickup_from_home_price && ` (+${selectedRoute.pickup_from_home_price} so'm)`}
            </Checkbox>

            <Checkbox
              checked={bookingData.delivery_to_home}
              onChange={(e) => setBookingData({ ...bookingData, delivery_to_home: e.target.checked })}
            >
              {t('delivery_to_home') || 'Uyga olib borish'}
              {selectedRoute.delivery_to_home_price && ` (+${selectedRoute.delivery_to_home_price} so'm)`}
            </Checkbox>

            <div className="pt-4 border-t">
              <div className="flex justify-between mb-2">
                <span>{t('total')}</span>
                <span className="text-xl font-bold text-amber-600">
                  {(
                    (bookingData.is_full_car ? selectedRoute.full_car_price : (selectedRoute.price_per_seat * bookingData.seats_booked)) +
                    (bookingData.pickup_from_home ? (selectedRoute.pickup_from_home_price || 0) : 0) +
                    (bookingData.delivery_to_home ? (selectedRoute.delivery_to_home_price || 0) : 0)
                  ).toLocaleString()} so'm
                </span>
              </div>
            </div>

            <Button
              type="primary"
              size="large"
              loading={loading}
              onClick={submitBooking}
              className="w-full h-12 bg-green-500 hover:bg-green-600 border-none font-bold"
            >
              {t('confirm_booking') || 'BUYURTMANI TASDIQLASH'}
            </Button>
          </div>
        )}
      </Drawer>
    </div>
  );
}
