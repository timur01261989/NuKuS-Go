import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input, Checkbox, message, Spin } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { supabase } from '../../config/supabase';
import LanguageSelector from '../../components/LanguageSelector';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    remember: false
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const phone = formData.phone.startsWith('+998') 
        ? formData.phone 
        : `+998${formData.phone.replace(/\D/g, '')}`;

      const { data, error } = await supabase.auth.signInWithPassword({
        phone,
        password: formData.password
      });

      if (error) throw error;

      // Get user details
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      message.success(t('login_success') || 'Muvaffaqiyatli kirildi!');
      
      // Redirect based on role
      if (user.role === 'driver') {
        navigate('/driver/home');
      } else {
        navigate('/client/home');
      }
    } catch (error) {
      console.error('Login error:', error);
      message.error(error.message || t('login_error') || 'Kirish xatoligi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 p-4">
      <Spin spinning={loading} size="large">
        <main className="w-full max-w-sm">
          {/* Header */}
          <header className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-500 rounded-2xl shadow-lg mb-4 transform rotate-3 hover:rotate-6 transition-transform">
              <span className="text-white text-3xl font-black tracking-tighter">UG</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 tracking-tight">
              {t('app_name')}
            </h1>
            <p className="text-blue-600 font-medium tracking-wide uppercase text-sm mt-1">
              {t('app_slogan')}
            </p>
          </header>

          {/* Login Form */}
          <section className="bg-white/90 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
              {t('login')}
            </h2>
            
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Phone Number */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase ml-1">
                  {t('phone_number')}
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-gray-400 font-medium">+998</span>
                  <Input
                    size="large"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="90 123 45 67"
                    className="pl-16 rounded-xl"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase ml-1">
                  {t('password')}
                </label>
                <div className="relative">
                  <Input.Password
                    size="large"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder="••••••••"
                    className="rounded-xl"
                    iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                    required
                  />
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-sm pt-1">
                <Checkbox
                  checked={formData.remember}
                  onChange={(e) => handleChange('remember', e.target.checked)}
                >
                  {t('remember_me')}
                </Checkbox>
                <Link to="/auth/forgot-password" className="text-blue-600 hover:underline font-medium">
                  {t('forgot_password')}
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                className="w-full h-12 bg-amber-500 hover:bg-amber-600 border-none rounded-xl font-bold shadow-lg shadow-amber-200 mt-4"
              >
                {t('login').toUpperCase()}
              </Button>
            </form>
          </section>

          {/* Footer */}
          <footer className="mt-8 text-center space-y-4">
            <p className="text-gray-600">
              {t('no_account')}{' '}
              <Link to="/auth/register" className="text-blue-600 font-bold hover:underline ml-1">
                {t('register')}
              </Link>
            </p>

            {/* Language Selector */}
            <LanguageSelector />
          </footer>
        </main>
      </Spin>
    </div>
  );
}
