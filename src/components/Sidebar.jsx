import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  UserOutlined, 
  SettingOutlined, 
  HistoryOutlined,
  HomeOutlined,
  LogoutOutlined,
  EnvironmentOutlined,
  WalletOutlined,
  BellOutlined,
  QuestionCircleOutlined,
  GlobalOutlined,
  MoonOutlined,
  SunOutlined,
  CarOutlined
} from '@ant-design/icons';
import { Avatar, Switch, Divider, message } from 'antd';
import { supabase } from '../config/supabase';

export default function Sidebar({ onClose }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    loadUser();
    
    // Load dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      message.success(t('logged_out') || 'Tizimdan chiqdingiz');
      navigate('/auth/login');
      onClose();
    } catch (error) {
      console.error('Logout error:', error);
      message.error(t('logout_error') || 'Chiqishda xatolik');
    }
  };

  const toggleDarkMode = (checked) => {
    setDarkMode(checked);
    localStorage.setItem('darkMode', checked);
    if (checked) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const menuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: t('profile') || 'Profil',
      path: '/client/profile'
    },
    {
      key: 'addresses',
      icon: <EnvironmentOutlined />,
      label: t('my_addresses') || 'Mening manzillarim',
      path: '/client/addresses'
    },
    {
      key: 'orders',
      icon: <HistoryOutlined />,
      label: t('my_orders') || 'Buyurtmalarim',
      path: '/client/orders'
    },
    {
      key: 'wallet',
      icon: <WalletOutlined />,
      label: t('wallet') || 'Hamyon',
      path: '/client/wallet'
    },
    {
      key: 'notifications',
      icon: <BellOutlined />,
      label: t('notifications') || 'Bildirishnomalar',
      path: '/client/notifications'
    }
  ];

  const bottomMenuItems = [
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('settings') || 'Sozlamalar',
      path: '/client/settings'
    },
    {
      key: 'support',
      icon: <QuestionCircleOutlined />,
      label: t('support') || 'Yordam',
      path: '/client/support'
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* User Profile Section */}
      <div className="p-6 bg-gradient-to-br from-amber-400 to-orange-500">
        <div className="flex items-center space-x-4">
          <Avatar
            size={64}
            src={user?.avatar_url}
            icon={<UserOutlined />}
            className="border-4 border-white shadow-lg"
          />
          <div className="flex-1 text-white">
            <h3 className="font-bold text-lg">
              {user?.full_name || t('guest') || 'Mehmon'}
            </h3>
            <p className="text-sm opacity-90">
              {user?.phone || '+998 XX XXX XX XX'}
            </p>
            <div className="flex items-center mt-2 space-x-2">
              <div className="flex items-center">
                ⭐️ <span className="ml-1 font-medium">{user?.rating?.toFixed(1) || '5.0'}</span>
              </div>
              <span className="opacity-75">•</span>
              <div className="flex items-center">
                <CarOutlined /> <span className="ml-1">{user?.total_rides || 0} reys</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Menu */}
      <div className="flex-1 overflow-y-auto">
        <nav className="py-4">
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => handleNavigation(item.path)}
              className="w-full flex items-center space-x-3 px-6 py-3 hover:bg-gray-50 transition-colors text-left"
            >
              <span className="text-xl text-gray-600">{item.icon}</span>
              <span className="text-gray-700 font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <Divider className="my-2" />

        {/* Settings Section */}
        <div className="py-4 px-6 space-y-4">
          {/* Language Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
              <GlobalOutlined className="mr-2" />
              {t('language') || 'Til'}
            </label>
            <select
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="kaa-latn">Qaraqalpaq (Lotin)</option>
              <option value="kaa-cyrl">Қарақалпақ (Кирил)</option>
              <option value="uz-latn">O'zbek (Lotin)</option>
              <option value="uz-cyrl">Ўзбек (Кирил)</option>
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between">
            <label className="flex items-center text-sm font-medium text-gray-700">
              {darkMode ? <MoonOutlined className="mr-2" /> : <SunOutlined className="mr-2" />}
              {t('dark_mode') || 'Tungi rejim'}
            </label>
            <Switch
              checked={darkMode}
              onChange={toggleDarkMode}
              checkedChildren="🌙"
              unCheckedChildren="☀️"
            />
          </div>
        </div>

        <Divider className="my-2" />

        {/* Bottom Menu */}
        <nav className="py-4">
          {bottomMenuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => handleNavigation(item.path)}
              className="w-full flex items-center space-x-3 px-6 py-3 hover:bg-gray-50 transition-colors text-left"
            >
              <span className="text-xl text-gray-600">{item.icon}</span>
              <span className="text-gray-700 font-medium">{item.label}</span>
            </button>
          ))}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-6 py-3 hover:bg-red-50 transition-colors text-left text-red-600"
          >
            <span className="text-xl"><LogoutOutlined /></span>
            <span className="font-medium">{t('logout') || 'Chiqish'}</span>
          </button>
        </nav>
      </div>

      {/* App Version */}
      <div className="p-4 text-center border-t border-gray-200">
        <p className="text-xs text-gray-500">
          {t('app_name')} v1.0.0
        </p>
        <p className="text-xs text-gray-400 mt-1">
          © 2026 {t('app_name')} - {t('app_slogan')}
        </p>
      </div>
    </div>
  );
}
