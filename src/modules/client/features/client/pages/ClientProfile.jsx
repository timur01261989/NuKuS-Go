import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import imageCompression from 'browser-image-compression';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabase/supabaseClient';
import { useLanguage } from '@/modules/shared/i18n/useLanguage.js';

const AVATAR_BUCKET = 'avatars';

const ClientProfile = memo(function ClientProfile() {
  const navigate = useNavigate();
  const { tr } = useLanguage();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState('');
  const [profileState, setProfileState] = useState({ fullName: '', phone: '', avatarUrl: '' });
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      setLoading(true);
      try {
        const [{ data: authData, error: authError }] = await Promise.all([supabase.auth.getUser()]);
        if (authError) throw authError;
        const currentUser = authData?.user;
        if (!currentUser?.id) throw new Error(tr('authRequired', 'Avval tizimga kiring.'));
        const { data: profileRow, error: profileError } = await supabase
          .from('profiles')
          .select('id,full_name,phone,avatar_url')
          .eq('id', currentUser.id)
          .maybeSingle();
        if (profileError) throw profileError;
        const metadata = currentUser.user_metadata || {};
        if (!mounted) return;
        setUserId(currentUser.id);
        setProfileState({
          fullName: String(profileRow?.full_name || metadata.full_name || '').trim(),
          phone: String(profileRow?.phone || currentUser.phone || '').trim(),
          avatarUrl: String(profileRow?.avatar_url || metadata.avatar_url || '').trim(),
        });
      } catch (error) {
        message.error(String(error?.message || tr('errorLoadingProfile', 'Profilni yuklashda xatolik yuz berdi.')));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadProfile();
    return () => {
      mounted = false;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl, tr]);

  const displayAvatar = useMemo(() => previewUrl || profileState.avatarUrl, [previewUrl, profileState.avatarUrl]);
  const initial = useMemo(() => (String(profileState.fullName || 'U').trim()[0] || 'U').toUpperCase(), [profileState.fullName]);
  const handleInputChange = useCallback((event) => {
    const { name, value } = event.target;
    setProfileState((current) => ({ ...current, [name]: value }));
  }, []);

  const handleAvatarSelect = useCallback(async (event) => {
    const nextFile = event.target.files?.[0];
    if (!nextFile) return;
    try {
      const compressedFile = await imageCompression(nextFile, {
        maxWidthOrHeight: 1200,
        maxSizeMB: 0.6,
        initialQuality: 0.78,
        useWebWorker: true,
      });
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const nextPreviewUrl = URL.createObjectURL(compressedFile);
      setSelectedAvatarFile(compressedFile);
      setPreviewUrl(nextPreviewUrl);
    } catch (error) {
      message.error(String(error?.message || tr('changePhoto', 'Rasmni o‘zgartirish')));
    }
  }, [previewUrl, tr]);

  const uploadAvatar = useCallback(async (file) => {
    if (!file || !userId) return profileState.avatarUrl || '';
    const extension = String(file.name || 'jpg').split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `avatars/${userId}-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from(AVATAR_BUCKET).upload(filePath, file, {
      upsert: true,
      contentType: file.type || 'image/jpeg',
    });
    if (uploadError) throw uploadError;
    const { data: publicUrlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath);
    return String(publicUrlData?.publicUrl || '').trim();
  }, [profileState.avatarUrl, userId]);

  const handleSave = useCallback(async (event) => {
    event.preventDefault();
    if (!userId) {
      message.error(tr('authRequired', 'Avval tizimga kiring.'));
      return;
    }
    setSaving(true);
    try {
      const trimmedFullName = String(profileState.fullName || '').trim();
      if (!trimmedFullName) throw new Error(tr('register.nameRequired', 'Ismingizni kiriting.'));
      const uploadedAvatarUrl = selectedAvatarFile ? await uploadAvatar(selectedAvatarFile) : profileState.avatarUrl;
      const timestamp = new Date().toISOString();
      const { error: authUpdateError } = await supabase.auth.updateUser({ data: { full_name: trimmedFullName, avatar_url: uploadedAvatarUrl || null } });
      if (authUpdateError) throw authUpdateError;
      const { error: profileUpdateError } = await supabase.from('profiles').update({
        full_name: trimmedFullName,
        avatar_url: uploadedAvatarUrl || null,
        updated_at: timestamp,
      }).eq('id', userId);
      if (profileUpdateError) throw profileUpdateError;
      setProfileState((current) => ({ ...current, fullName: trimmedFullName, avatarUrl: uploadedAvatarUrl || '' }));
      setSelectedAvatarFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl('');
      }
      message.success(tr('profileUpdated', 'Profil muvaffaqiyatli saqlandi!'));
    } catch (error) {
      message.error(String(error?.message || tr('errorSavingProfile', 'Ma’lumotlarni saqlashda xatolik yuz berdi.')));
    } finally {
      setSaving(false);
    }
  }, [previewUrl, profileState.avatarUrl, profileState.fullName, selectedAvatarFile, tr, uploadAvatar, userId]);

  if (loading) {
    return (
      <div className="unigo-page flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primaryHome border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="unigo-page pb-8">
      <header className="unigo-topbar px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button type="button" onClick={() => navigate(-1)} className="unigo-soft-card flex h-11 w-11 items-center justify-center p-0">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-black text-slate-900">{tr('profileSettings', 'Profil ma’lumotlari')}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-4 pt-5">
        <form onSubmit={handleSave} className="space-y-5">
          <section className="unigo-dark-card flex flex-col items-center p-6 text-center">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/10">
                {displayAvatar ? <img src={displayAvatar} alt="Profile Avatar" className="h-full w-full object-cover" /> : <span className="text-3xl font-black text-white">{initial}</span>}
              </div>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-primaryHome text-white shadow-lg">
                <span className="material-symbols-outlined text-[18px]">photo_camera</span>
              </button>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handleAvatarSelect} className="hidden" />
            </div>
            <div className="mt-4 text-lg font-black text-white">{profileState.fullName || 'Foydalanuvchi'}</div>
            <div className="mt-1 text-sm text-slate-300">Rasmni o‘zgartirish va ma’lumotlarni yangilash</div>
          </section>

          <section className="unigo-soft-card p-5">
            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-800">To‘liq ism</span>
                <input name="fullName" value={profileState.fullName} onChange={handleInputChange} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[15px] font-medium text-slate-900 outline-none focus:border-primaryHome" placeholder="Ismingiz va familiyangiz" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-800">Telefon raqam</span>
                <input name="phone" value={profileState.phone} onChange={handleInputChange} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] font-medium text-slate-500 outline-none" placeholder="+998 XX XXX XX XX" disabled />
              </label>
            </div>
          </section>

          <section className="rounded-[24px] bg-gradient-to-r from-[#FFF1E7] to-[#EAF2FF] p-5 shadow-[0_10px_24px_rgba(28,36,48,.08)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-black text-slate-900">Do‘stlarni taklif qilish</div>
                <div className="mt-1 text-sm text-slate-600">Taklif havolasi va referral bonuslarini shu bo‘limdan boshqaring</div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-white text-primaryHome">
                <span className="material-symbols-outlined">share</span>
              </div>
            </div>
            <button type="button" className="unigo-secondary-btn mt-4 min-h-[48px] px-4" onClick={() => navigate('/client/referral')}>Takliflar bo‘limi</button>
          </section>

          <button type="submit" disabled={saving} className="unigo-primary-btn flex min-h-[56px] w-full items-center justify-center px-5 text-base font-black disabled:opacity-60">
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </form>
      </main>
    </div>
  );
});

export default ClientProfile;
