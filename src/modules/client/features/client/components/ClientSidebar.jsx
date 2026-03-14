import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabase/supabaseClient';
import { useLanguage } from '@/modules/shared/i18n/useLanguage.js';
import { formatClientMoney } from '../shared/i18n_clientLocalize';

function cx(...xs) {
  return xs.filter(Boolean).join(' ');
}

const SidebarItem = memo(function SidebarItem({ icon, label, active, onClick }) {
  return (
    <button
      type="button"
      className={cx(
        'w-full flex items-center gap-4 p-3 rounded-xl transition-colors text-left',
        active ? 'bg-primarySidebar/10 text-primarySidebar border border-primarySidebar/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
      )}
      onClick={onClick}
    >
      <span className={cx('material-symbols-outlined', active ? '' : 'text-slate-400')} data-no-auto-translate="true">{icon}</span>
      <span className={cx(active ? 'font-semibold' : 'font-medium')}>{label}</span>
    </button>
  );
});

const ClientSidebar = memo(function ClientSidebar({ open, onClose, profile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, tr } = useLanguage();
  const [walletState, setWalletState] = useState({
    balanceUZS: null,
    bonusBalanceUZS: null,
  });

  const fullName = profile?.fullName || t.userLabel;
  const avatarUrl = profile?.avatarUrl || '';

  const initial = useMemo(() => {
    const normalized = String(fullName || '').trim();
    return (normalized[0] || 'U').toUpperCase();
  }, [fullName]);

  useEffect(() => {
    let mounted = true;

    async function loadBalance() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;
        if (!user) return;

        const { getWalletBalance } = await import('@/services/walletApi.js');
        const walletResponse = await getWalletBalance(user.id);
        const nextWallet = walletResponse?.wallet || walletResponse || {};

        if (mounted) {
          setWalletState({
            balanceUZS: typeof nextWallet?.balance_uzs === 'number' ? nextWallet.balance_uzs : 0,
            bonusBalanceUZS: typeof nextWallet?.bonus_balance_uzs === 'number' ? nextWallet.bonus_balance_uzs : 0,
          });
        }
      } catch (error) {
        console.error('Balance fetch error:', error);
      }
    }

    if (open) {
      loadBalance();
    }

    return () => {
      mounted = false;
    };
  }, [open]);

  const go = useCallback((path, options) => {
    onClose?.();
    navigate(path, options);
  }, [navigate, onClose]);

  const balanceLabel = useMemo(() => formatClientMoney(language, walletState.balanceUZS), [walletState.balanceUZS, language]);
  const bonusLabel = useMemo(() => formatClientMoney(language, walletState.bonusBalanceUZS), [language, walletState.bonusBalanceUZS]);
  const isActive = useCallback((path) => location.pathname === path, [location.pathname]);

  const menuItems = useMemo(() => ([
    {
      key: 'profile',
      icon: 'person',
      label: t.profileSettings || 'Profil ma‘lumotlari',
      path: '/client/profile',
    },
    {
      key: 'wallet',
      icon: 'account_balance_wallet',
      label: tr('wallet', 'Hamyon'),
      path: '/client/wallet',
    },
    {
      key: 'referral',
      icon: 'share',
      label: tr('inviteFriends', 'Do‘stlarni taklif qilish'),
      path: '/client/referral',
    },
    {
      key: 'promos',
      icon: 'card_giftcard',
      label: t.promos,
      path: '/client/promo',
    },
    {
      key: 'settings',
      icon: 'settings',
      label: t.settings,
      path: '/settings',
    },
  ]), [t, tr]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <aside className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85%] bg-white dark:bg-background-dark shadow-2xl flex flex-col transition-transform">
        <div className="p-6 bg-primarySidebar/10 dark:bg-primarySidebar/5 border-b border-primarySidebar/10">
          <div className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => go('/client/profile')}>
            <div className="relative group">
              <div className="size-16 rounded-full border-2 border-primarySidebar overflow-hidden bg-white flex items-center justify-center">
                {avatarUrl ? <img className="w-full h-full object-cover" alt="avatar" src={avatarUrl} /> : <span className="text-xl font-bold text-primarySidebar">{initial}</span>}
              </div>
              <div className="absolute -bottom-1 -right-1 size-6 bg-primarySidebar rounded-full flex items-center justify-center border-2 border-white dark:border-background-dark">
                <span className="material-symbols-outlined text-white text-[14px]">edit</span>
              </div>
            </div>

            <div className="flex flex-col flex-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight truncate">{fullName}</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="size-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400 italic">{t.passenger || t.userLabel || 'Yo‘lovchi'}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2">
            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{tr('wallet.mainBalance', 'Asosiy balans')}</p>
              <p className="text-sm font-bold text-primarySidebar">{balanceLabel}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{tr('bonusBalance', 'Bonus balansi')}</p>
              <p className="text-sm font-bold text-amber-500">{bonusLabel}</p>
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

          {menuItems.map((item) => (
            <SidebarItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              active={isActive(item.path.replace('/client', '')) || isActive(item.path)}
              onClick={() => go(item.path)}
            />
          ))}
        </nav>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800">
          <button type="button" className="flex items-center gap-3 w-full text-slate-500 dark:text-slate-400 hover:text-red-500 transition-colors group" onClick={() => go('/logout')}>
            <span className="material-symbols-outlined group-hover:rotate-180 transition-transform duration-300">logout</span>
            <span className="font-medium">{t.logout}</span>
          </button>
          <p className="mt-4 text-center text-[10px] text-slate-400 font-medium">{t.appName}</p>
          <p className="mt-1 text-center text-[10px] text-slate-500 font-semibold">UniGo</p>
        </div>
      </aside>
    </>
  );
});

export default ClientSidebar;
