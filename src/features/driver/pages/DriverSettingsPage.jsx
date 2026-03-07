import React from 'react';
import { useLanguage } from '@shared/i18n/useLanguage';
import PageBackButton from '@/shared/components/PageBackButton';

export default function DriverSettingsPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-white">
      <div className="p-4 flex items-center gap-3 border-b">
        <PageBackButton fallback="/driver/dashboard" />
        <div className="font-extrabold">{t.settingsTitle}</div>
      </div>
      <div className="p-4 text-sm text-gray-600">{t.demoPlaceholder} Keyin til, bildirishnoma, profil va boshqa sozlamalarni shu faylga qo‘shasan.</div>
    </div>
  );
}
