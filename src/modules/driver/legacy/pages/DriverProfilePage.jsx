import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabase/supabaseClient';

function initials(name) {
  const s = String(name || '').trim();
  return (s[0] || 'H').toUpperCase();
}

export default function DriverProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ fullName: '', phone: '', avatarUrl: '' });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;
        if (!user?.id) return;
        const [profileRes, appRes] = await Promise.all([
          supabase.from('profiles').select('full_name,phone,avatar_url').eq('id', user.id).maybeSingle(),
          supabase.from('driver_applications').select('first_name,last_name,phone').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        ]);
        const fullName = String(profileRes?.data?.full_name || `${appRes?.data?.first_name || ''} ${appRes?.data?.last_name || ''}`.trim() || '').trim();
        const phone = String(profileRes?.data?.phone || appRes?.data?.phone || user.phone || '').trim();
        const avatarUrl = String(profileRes?.data?.avatar_url || user.user_metadata?.avatar_url || '').trim();
        if (mounted) setProfile({ fullName, phone, avatarUrl });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const initial = useMemo(() => initials(profile.fullName), [profile.fullName]);

  return (
    <div className="unigo-page pb-8">
      <header className="unigo-topbar px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button type="button" onClick={() => navigate('/driver')} className="unigo-soft-card flex h-11 w-11 items-center justify-center p-0">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-black text-slate-900">Haydovchi profili</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-4 pt-5">
        <section className="unigo-dark-card p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/10 text-2xl font-black text-white">
              {profile.avatarUrl ? <img src={profile.avatarUrl} alt="avatar" className="h-full w-full object-cover" /> : initial}
            </div>
            <div>
              <div className="text-xl font-black text-white">{loading ? 'Yuklanmoqda...' : (profile.fullName || 'Haydovchi')}</div>
              <div className="mt-1 text-sm text-slate-300">{profile.phone || 'Telefon raqam mavjud emas'}</div>
            </div>
          </div>
        </section>

        <section className="unigo-soft-card p-5">
          <div className="text-base font-black text-slate-900">Yo‘lovchi tarafga o‘tish</div>
          <div className="mt-1 text-sm text-slate-500">Client asosiy sahifasi, buyurtmalar va hamyon bo‘limiga qaytish</div>
          <button type="button" className="unigo-secondary-btn mt-4 min-h-[48px] px-4" onClick={() => navigate('/client/home')}>Yo‘lovchi tarafga o‘tish</button>
        </section>
      </main>
    </div>
  );
}
