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
  const [profileState, setProfileState] = useState({
    fullName: '',
    phone: '',
    avatarUrl: '',
  });
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      setLoading(true);
      try {
        const [{ data: authData, error: authError }] = await Promise.all([
          supabase.auth.getUser(),
        ]);

        if (authError) {
          throw authError;
        }

        const currentUser = authData?.user;
        if (!currentUser?.id) {
          throw new Error(tr('authRequired', 'Avval tizimga kiring.'));
        }

        const { data: profileRow, error: profileError } = await supabase
          .from('profiles')
          .select('id,full_name,phone,avatar_url')
          .eq('id', currentUser.id)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

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
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      mounted = false;
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, tr]);

  const displayAvatar = useMemo(() => previewUrl || profileState.avatarUrl, [previewUrl, profileState.avatarUrl]);
  const initial = useMemo(() => {
    const normalized = String(profileState.fullName || 'U').trim();
    return (normalized[0] || 'U').toUpperCase();
  }, [profileState.fullName]);

  const handleInputChange = useCallback((event) => {
    const { name, value } = event.target;
    setProfileState((current) => ({
      ...current,
      [name]: value,
    }));
  }, []);

  const handleAvatarSelect = useCallback(async (event) => {
    const nextFile = event.target.files?.[0];
    if (!nextFile) {
      return;
    }

    try {
      const compressedFile = await imageCompression(nextFile, {
        maxWidthOrHeight: 1200,
        maxSizeMB: 0.6,
        initialQuality: 0.78,
        useWebWorker: true,
      });

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      const nextPreviewUrl = URL.createObjectURL(compressedFile);
      setSelectedAvatarFile(compressedFile);
      setPreviewUrl(nextPreviewUrl);
    } catch (error) {
      message.error(String(error?.message || tr('changePhoto', 'Rasmni o‘zgartirish')));
    }
  }, [previewUrl, tr]);

  const uploadAvatar = useCallback(async (file) => {
    if (!file || !userId) {
      return profileState.avatarUrl || '';
    }

    const extension = String(file.name || 'jpg').split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `avatars/${userId}-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type || 'image/jpeg',
      });

    if (uploadError) {
      throw uploadError;
    }

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
      if (!trimmedFullName) {
        throw new Error(tr('register.nameRequired', 'Ismingizni kiriting.'));
      }

      const uploadedAvatarUrl = selectedAvatarFile ? await uploadAvatar(selectedAvatarFile) : profileState.avatarUrl;
      const timestamp = new Date().toISOString();

      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: {
          full_name: trimmedFullName,
          avatar_url: uploadedAvatarUrl || null,
        },
      });

      if (authUpdateError) {
        throw authUpdateError;
      }

      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          full_name: trimmedFullName,
          avatar_url: uploadedAvatarUrl || null,
          updated_at: timestamp,
        })
        .eq('id', userId);

      if (profileUpdateError) {
        throw profileUpdateError;
      }

      setProfileState((current) => ({
        ...current,
        fullName: trimmedFullName,
        avatarUrl: uploadedAvatarUrl || '',
      }));
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

  const goToReferralPage = useCallback(() => {
    navigate('/client/referral');
  }, [navigate]);

  const goBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primarySidebar border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col pb-6">
      <header className="bg-white dark:bg-background-dark shadow-sm sticky top-0 z-20 px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={goBack}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">
          {tr('profileSettings', 'Profil ma’lumotlari')}
        </h1>
      </header>

      <main className="flex-1 px-4 pt-6 max-w-2xl mx-auto w-full space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white dark:bg-background-dark p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center">
            <div className="relative group mb-4">
              <div className="size-24 md:size-28 rounded-full border-4 border-slate-50 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center shadow-inner">
                {displayAvatar ? (
                  <img src={displayAvatar} alt="Profile Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-slate-400 dark:text-slate-500">{initial}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-primarySidebar text-white rounded-full shadow-lg hover:bg-primarySidebar/90 transition-colors border-2 border-white dark:border-background-dark"
              >
                <span className="material-symbols-outlined text-[18px]">photo_camera</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleAvatarSelect}
                className="hidden"
              />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              {tr('changePhoto', 'Rasmni o‘zgartirish')}
            </p>
          </div>

          <div className="bg-white dark:bg-background-dark p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {tr('fullName', 'To‘liq ism-sharif')}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px]">
                  person
                </span>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={profileState.fullName}
                  onChange={handleInputChange}
                  placeholder={tr('register.namePlaceholder', 'Ismingiz')}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primarySidebar/50 focus:border-primarySidebar transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {tr('phoneNumber', 'Telefon raqam')}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px]">
                  call
                </span>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  value={profileState.phone}
                  readOnly
                  className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-primarySidebar text-white font-bold py-3 hover:bg-primarySidebar/90 active:scale-[0.99] transition-all disabled:opacity-60"
            >
              {saving ? tr('loading', 'Yuklanmoqda...') : tr('save', 'Saqlash')}
            </button>
          </div>
        </form>

        <section className="bg-white dark:bg-background-dark p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {tr('inviteFriends', 'Do‘stlarni taklif qilish')}
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-6">
                {tr('inviteFriendsMsg', 'Do‘stlarni taklif qiling va ikkalangiz ham bonusga ega bo‘ling')}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primarySidebar/10 text-primarySidebar flex items-center justify-center">
              <span className="material-symbols-outlined">share</span>
            </div>
          </div>

          <button
            type="button"
            onClick={goToReferralPage}
            className="mt-4 w-full rounded-xl border border-primarySidebar/20 bg-primarySidebar/10 text-primarySidebar font-bold py-3 hover:bg-primarySidebar/15 active:scale-[0.99] transition-all"
          >
            {tr('shareReferral', 'Taklif ulashish')}
          </button>
        </section>
      </main>
    </div>
  );
});

export default ClientProfile;
