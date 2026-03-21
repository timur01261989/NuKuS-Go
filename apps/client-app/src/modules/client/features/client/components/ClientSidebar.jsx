import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/services/supabase/supabaseClient';
import { useLanguage } from '@/modules/shared/i18n/useLanguage.js';
import { formatClientMoney } from '../shared/i18n_clientLocalize';

function cx(...xs) { return xs.filter(Boolean).join(' '); }

const SidebarItem = memo(function SidebarItem({ icon, label, active, onClick }) {
  return (
    <button
      type="button"
      className={cx(
        'w-full rounded-[20px] border px-4 py-3 text-left transition flex items-center gap-4',
        active
          ? 'border-primaryHome/20 bg-orange-50 text-primaryHome shadow-[0_8px_20px_rgba(244,106,10,.08)]'
          : 'border-slate-100 bg-white text-slate-700 hover:bg-slate-50'
      )}
      onClick={onClick}
    >
      <span className={cx('material-symbols-outlined', active ? 'text-primaryHome' : 'text-slate-400')} data-no-auto-translate="true">{icon}</span>
      <span className={cx('text-sm', active ? 'font-bold' : 'font-semibold')}>{label}</span>
    </button>
  );
});

const ClientSidebar = memo(function ClientSidebar({ open, onClose, profile }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, tr } = useLanguage();
  const [walletState, setWalletState] = useState({ balanceUZS: null, bonusBalanceUZS: null });

  const fullName = profile?.fullName || t.userLabel || 'Foydalanuvchi';
  const avatarUrl = profile?.avatarUrl || '';
  const initial = useMemo(() => (String(fullName).trim()[0] || 'U').toUpperCase(), [fullName]);

  useEffect(() => {
    let mounted = true;
    async function loadBalance() {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;
        if (!user) return;
        const { getWalletBalance } = await import('@/services/walletApi.js');
        const walletResponse = await getWalletBalance(user.id);
        const wallet = walletResponse?.wallet && typeof walletResponse.wallet === 'object' ? walletResponse.wallet : walletResponse;
        if (mounted) {
          setWalletState({
            balanceUZS: typeof wallet?.balance_uzs === 'number' ? wallet.balance_uzs : null,
            bonusBalanceUZS: typeof wallet?.bonus_balance_uzs === 'number' ? wallet.bonus_balance_uzs : null,
          });
        }
      } catch {}
    }
    if (open) loadBalance();
    return () => { mounted = false; };
  }, [open]);

  const go = useCallback((path, options) => {
    onClose?.();
    navigate(path, options);
  }, [navigate, onClose]);

  const balanceLabel = useMemo(() => formatClientMoney(language, walletState.balanceUZS), [walletState.balanceUZS, language]);
  const bonusBalanceLabel = useMemo(() => formatClientMoney(language, walletState.bonusBalanceUZS), [walletState.bonusBalanceUZS, language]);
  const isActive = useCallback((path) => location.pathname === path, [location.pathname]);

  const menuItems = useMemo(() => ([
    { key: 'profile', icon: 'person', label: t.profileSettings || 'Profil ma’lumotlari', path: '/client/profile' },
    { key: 'referral', icon: 'share', label: tr('inviteFriends', 'Do‘stlarni taklif qilish'), path: '/client/referral' },
    { key: 'promos', icon: 'card_giftcard', label: t.promos || 'Promokodlar', path: '/client/promo' },
    { key: 'settings', icon: 'settings', label: t.settings || 'Sozlamalar', path: '/settings' },
  ]), [t, tr]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <aside className="fixed inset-y-0 left-0 z-50 flex w-80 max-w-[88%] flex-col bg-[#F8FBFF] shadow-[0_18px_42px_rgba(28,36,48,.22)]">
        <div className="border-b border-slate-200/80 px-5 pb-5 pt-6">
          <div className="unigo-dark-card p-4">
            <div className="flex items-center gap-4" onClick={() => go('/client/profile')}>
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/10">
                {avatarUrl ? <img className="h-full w-full object-cover" alt="avatar" src={avatarUrl} /> : <span className="text-xl font-black text-white">{initial}</span>}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-black text-white">{fullName}</h2>
                <div className="mt-1 flex items-center gap-2 text-sm text-slate-300">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                  <span>{t.passenger || 'Yo‘lovchi'}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-[18px] bg-white/8 p-3">
                <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{t.balance || 'Balans'}</div>
                <div className="mt-1 text-sm font-bold text-white">{balanceLabel}</div>
              </div>
              <div className="rounded-[18px] bg-white/8 p-3">
                <div className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{tr('bonusBalance', 'Bonus')}</div>
                <div className="mt-1 text-sm font-bold text-white">{bonusBalanceLabel}</div>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="mt-4 w-full rounded-[22px] bg-gradient-to-r from-[#FFF1E7] to-[#EAF2FF] p-4 text-left shadow-[0_10px_24px_rgba(28,36,48,.08)]"
            onClick={() => go('/driver-mode', { replace: true, state: { from: location.pathname } })}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-black text-slate-900">{t.workAsDriver || 'Haydovchi tarafga o‘tish'}</div>
                <div className="mt-1 text-sm text-slate-600">Haydovchi paneli, buyurtmalar va xizmatlarni boshqaring</div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-white text-primaryHome">
                <span className="material-symbols-outlined" data-no-auto-translate="true">local_taxi</span>
              </div>
            </div>
          </button>
        </div>

        <nav className="flex-1 space-y-3 overflow-y-auto px-4 py-5">
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

        <div className="border-t border-slate-200 px-5 py-5">
          <button type="button" className="flex w-full items-center gap-3 rounded-[18px] border border-red-100 bg-red-50 px-4 py-3 text-red-500" onClick={() => go('/logout')}>
            <span className="material-symbols-outlined" data-no-auto-translate="true">logout</span>
            <span className="font-bold">{t.logout || 'Chiqish'}</span>
          </button>
        </div>
      </aside>
    </>
  );
});

export default ClientSidebar;
