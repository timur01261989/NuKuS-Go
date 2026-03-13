import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/services/supabase/supabaseClient';
import { useLanguage } from '@/modules/shared/i18n/useLanguage.js';
import { formatClientMoney } from '../shared/i18n_clientLocalize';

function cx(...xs) {
  return xs.filter(Boolean).join(' ');
}

export default function ClientSidebar({ open, onClose, profile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
  const [balanceUZS, setBalanceUZS] = useState(null);

  const fullName = profile?.fullName || t.userLabel;
  const avatarUrl = profile?.avatarUrl || '';

  const initial = useMemo(() => {
    const s = String(fullName || '').trim();
    return (s[0] || 'U').toUpperCase();
  }, [fullName]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        const user = u?.user;
        if (!user) return;
        try {
          const { getWalletBalance } = await import('@/services/walletApi.js');
          const j = await getWalletBalance(user.id);
          const bal = typeof j?.balance_uzs === 'number' ? j.balance_uzs : null;
          if (mounted) setBalanceUZS(bal);
        } catch (err) {
          console.error("Balance fetch error:", err);
        }
      } catch (err) {
        console.error("Auth error:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const go = (path, opts) => {
    onClose?.();
    navigate(path, opts);
  };

  const balanceLabel = formatClientMoney(language, balanceUZS);
  
  if (!open) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      <aside className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85%] bg-white dark:bg-background-dark shadow-2xl flex flex-col transition-transform">
        <div className="p-6 bg-primarySidebar/10 dark:bg-primarySidebar/5 border-b border-primarySidebar/10">
          {/* Profil ma'lumotlarini ko'rish va tahrirlash bo'limi */}
          <div 
            className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => go('/client/profile')}
          >
            <div className="relative group">
              <div className="size-16 rounded-full border-2 border-primarySidebar overflow-hidden bg-white flex items-center justify-center">
                {avatarUrl ? (
                  <img className="w-full h-full object-cover" alt="avatar" src={avatarUrl} />
                ) : (
                  <span className="text-xl font-bold text-primarySidebar">{initial}</span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 size-6 bg-primarySidebar rounded-full flex items-center justify-center border-2 border-white dark:border-background-dark">
                <span className="material-symbols-outlined text-white text-[14px]">edit</span>
              </div>
            </div>
            
            <div className="flex flex-col flex-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight truncate">
                {fullName}
              </h2>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="size-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 italic">
                  {t.passenger || t.userLabel || "Yo‘lovchi"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <div className="flex-1 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{t.balance}</p>
              <p className="text-sm font-bold text-primarySidebar">{balanceLabel}</p>
            </div>
            <div className="flex-1 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{t.rating}</p>
              <div className="flex items-center gap-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white">4.9</p>
                <span className="material-symbols-outlined text-[14px] text-yellow-500 font-variation-fill">star</span>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <button 
            type="button" 
            className="w-full flex items-center gap-4 p-3 rounded-xl transition-colors bg-primarySidebar/10 text-primarySidebar border border-primarySidebar/20 text-left" 
            onClick={() => go('/driver-mode', { replace: true, state: { from: location.pathname } })}
          >
            <span className="material-symbols-outlined" data-no-auto-translate="true">local_taxi</span>
            <span className="font-semibold">{t.workAsDriver}</span>
          </button>

          <div className="py-2"><div className="h-px bg-slate-100 dark:bg-slate-800 mx-3" /></div>

          <SidebarItem 
            icon="person" 
            label={t.profileSettings || "Profil ma'lumotlari"} 
            onClick={() => go('/client/profile')} 
          />
          <SidebarItem 
            icon="location_on" 
            label={t.myAddresses} 
            onClick={() => go('/client/addresses')} 
          />
          <SidebarItem 
            icon="history" 
            label={t.history} 
            onClick={() => go('/client/orders')} 
          />
          <SidebarItem 
            icon="payments" 
            label={t.paymentMethods} 
            onClick={() => go('/client/payment-methods')} 
          />
          <SidebarItem 
            icon="card_giftcard" 
            label={t.promos} 
            onClick={() => go('/client/promo')} 
          />

          <div className="py-2"><div className="h-px bg-slate-100 dark:bg-slate-800 mx-3" /></div>

          <SidebarItem icon="settings" label={t.settings} onClick={() => go('/settings')} />
          <SidebarItem icon="help_center" label={t.help} onClick={() => go('/support')} />
        </nav>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800">
          <button 
            type="button" 
            className="flex items-center gap-3 w-full text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors group" 
            onClick={() => go('/logout')}
          >
            <span className="material-symbols-outlined group-hover:rotate-180 transition-transform duration-300">logout</span>
            <span className="font-medium">{t.logout}</span>
          </button>
          <p className="mt-4 text-center text-[10px] text-slate-400 font-medium">{t.appName}</p>
          <p className="mt-1 text-center text-[10px] text-slate-500 font-semibold">UniGo</p>
        </div>
      </aside>
    </>
  );
}

function SidebarItem({ icon, label, active, onClick }) {
  return (
    <button 
      type="button" 
      className={cx(
        'w-full flex items-center gap-4 p-3 rounded-xl transition-colors text-left', 
        active ? 'bg-primarySidebar/10 text-primarySidebar border border-primarySidebar/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
      )} 
      onClick={onClick}
    >
      <span 
        className={cx('material-symbols-outlined', active ? '' : 'text-slate-400')} 
        data-no-auto-translate="true"
      >
        {icon}
      </span>
      <span className={cx(active ? 'font-semibold' : 'font-medium')}>{label}</span>
    </button>
  );
}