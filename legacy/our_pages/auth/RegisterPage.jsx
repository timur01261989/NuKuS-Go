import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from 'antd';

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 to-blue-100 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8">
        <h1 className="text-2xl font-bold text-center mb-6">{t('register')}</h1>
        <p className="text-center text-gray-600 mb-4">Registration page - To be implemented</p>
        <Link to="/auth/login">
          <Button type="primary" size="large" block>
            {t('login')}
          </Button>
        </Link>
      </div>
    </div>
  );
}
