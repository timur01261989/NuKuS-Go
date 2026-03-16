import React from 'react';
import { useLanguage } from '@/modules/shared/i18n/useLanguage.js';
import PageBackButton from '@/modules/shared/components/PageBackButton';

export default function DriverProfilePage() {
  const { t } = useLanguage();
  const desc = t.demoPlaceholder ? `${t.demoPlaceholder} Keyin shu faylni tahrirlab profil ma'lumotlarini qo'shasiz.` : undefined;

  return (
    <div className="min-h-screen bg-[#f6f7fb] p-4">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <PageBackButton fallback="/driver/dashboard" className="rounded-xl px-3 py-2 text-sm font-medium bg-black/5 hover:bg-black/10" iconClassName="material-symbols-rounded text-base" />
              <h1 className="text-lg font-semibold">{t.profile}</h1>
            </div>
          </div>
          <div className="mt-3 rounded-2xl bg-black/5 p-3 text-sm text-black/70">{desc || ""}</div>
        </div>
      </div>
    </div>
  );
}
