import React from 'react';
import { useLanguage } from '@shared/i18n/useLanguage';
import PageBackButton from '@/shared/components/PageBackButton';

export default function DriverWalletPage() {
  const { t } = useLanguage();
  const desc = t.demoPlaceholder ? `${t.demoPlaceholder} Keyin shu faylga to‘lov usullari va balans logikasini qo‘shasiz.` : undefined;
  return (
    <div className="min-h-screen bg-white">
      <div className="p-4 flex items-center gap-3 border-b">
        <PageBackButton fallback="/driver/dashboard" />
        <div className="font-extrabold">{t.wallet}</div>
      </div>
      <div className="p-4 text-sm text-gray-600">{desc || ""}</div>
    </div>
  );
}
