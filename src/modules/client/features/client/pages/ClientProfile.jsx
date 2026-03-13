import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabase/supabaseClient';
import { useLanguage } from '@/modules/shared/i18n/useLanguage.js';

export default function ClientProfile() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Forma maydonlari
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        setLoading(true);
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        if (user && mounted) {
          setUser(user);
          setPhone(user.phone || '');
          
          // Profil ma'lumotlarini public.profiles jadvalidan yoki auth metadata'dan olish
          // UniGo loyihasi qaysi biridan foydalanishiga qarab moslashtirilgan standart variant
          const metadata = user.user_metadata || {};
          setFullName(metadata.full_name || metadata.fullName || '');
          setAvatarUrl(metadata.avatar_url || metadata.avatarUrl || '');
        }
      } catch (error) {
        console.error('Profilni yuklashda xatolik:', error.message);
        if (mounted) setMessage({ type: 'error', text: t.errorLoadingProfile || "Profilni yuklashda xatolik yuz berdi." });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [t]);

  const handleFileChange = (e) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    const file = e.target.files[0];
    setAvatarFile(file);
    
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const uploadAvatar = async (userId, file) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars') // Supabase'da 'avatars' deb nomlangan storage bucket bo'lishi kerak
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Rasm yuklash xatosi:', error.message);
      throw error;
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      let finalAvatarUrl = avatarUrl;

      // Agar yangi rasm tanlangan bo'lsa, uni yuklaymiz
      if (avatarFile && user) {
        finalAvatarUrl = await uploadAvatar(user.id, avatarFile);
        setAvatarUrl(finalAvatarUrl);
      }

      // Supabase Auth metadata'ni yangilaymiz
      const { error: updateError } = await supabase.auth.updateUser({
        data: { 
          full_name: fullName,
          avatar_url: finalAvatarUrl 
        }
      });

      if (updateError) throw updateError;

      // Agar loyihangizda alohida "profiles" jadvali ham bo'lsa, uni ham shu yerda yangilash tavsiya etiladi:
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName, 
          avatar_url: finalAvatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (dbError && dbError.code !== 'PGRST116') {
        // PGRST116 xatosi - jadval bo'lmasa yoki yozuv topilmasa chiqadi. Buni ignor qilsa bo'ladi.
        console.warn('Baza yangilanishida xatolik:', dbError.message);
      }

      setMessage({ type: 'success', text: t.profileUpdated || "Profil muvaffaqiyatli saqlandi!" });
    } catch (error) {
      console.error('Saqlashda xatolik:', error.message);
      setMessage({ type: 'error', text: error.message || t.errorSavingProfile || "Ma'lumotlarni saqlashda xatolik yuz berdi." });
    } finally {
      setSaving(false);
    }
  };

  const displayAvatar = previewUrl || avatarUrl;
  const initial = String(fullName || 'U').trim()[0].toUpperCase();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primarySidebar border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col pb-6">
      {/* Header */}
      <header className="bg-white dark:bg-background-dark shadow-sm sticky top-0 z-20 px-4 py-3 flex items-center gap-3">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">
          {t.profileSettings || "Profil ma'lumotlari"}
        </h1>
      </header>

      <main className="flex-1 px-4 pt-6 max-w-2xl mx-auto w-full">
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/20' 
              : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20'
          }`}>
            <span className="material-symbols-outlined text-[20px]">
              {message.type === 'success' ? 'check_circle' : 'error'}
            </span>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar bo'limi */}
          <div className="bg-white dark:bg-background-dark p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center">
            <div className="relative group mb-4">
              <div className="size-24 md:size-28 rounded-full border-4 border-slate-50 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center shadow-inner">
                {displayAvatar ? (
                  <img 
                    src={displayAvatar} 
                    alt="Profile Avatar" 
                    className="w-full h-full object-cover"
                  />
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
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/png, image/jpeg, image/jpg, image/webp" 
                className="hidden" 
              />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              {t.changePhoto || "Rasmni o'zgartirish"}
            </p>
          </div>

          {/* Ma'lumotlar bo'limi */}
          <div className="bg-white dark:bg-background-dark p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.fullName || "To'liq ism-sharif"}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px]">
                  person
                </span>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ismingizni kiriting"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primarySidebar/50 focus:border-primarySidebar transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.phoneNumber || "Telefon raqam"}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px]">
                  call
                </span>
                <input
                  id="phone"
                  type="text"
                  value={phone}
                  readOnly
                  disabled
                  className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-500 cursor-not-allowed"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                {t.phoneCannotBeChanged || "Telefon raqamni ilova orqali o'zgartirib bo'lmaydi."}
              </p>
            </div>
          </div>

          {/* Saqlash tugmasi */}
          <button
            type="submit"
            disabled={saving}
            className={`w-full py-3.5 rounded-xl font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 ${
              saving 
                ? 'bg-primarySidebar/70 cursor-not-allowed' 
                : 'bg-primarySidebar hover:bg-primarySidebar/90 hover:shadow-lg active:scale-[0.98]'
            }`}
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {t.saving || "Saqlanmoqda..."}
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">save</span>
                {t.saveChanges || "O'zgarishlarni saqlash"}
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}