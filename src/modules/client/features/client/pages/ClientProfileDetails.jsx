import React, { memo, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/shared/auth/AuthProvider.jsx';
import { getOwnReferralSnapshot, shareReferralLink } from '@/services/referralLinkService.js';
import { UnigoButton, UnigoCard, UnigoHeader, UnigoInput, UnigoScreen, UnigoSection } from '@/modules/shared/ui/UnigoMobileUI.jsx';

function getInitials(fullName, phone) {
  const safeName = String(fullName || '').trim();
  if (safeName) {
    const parts = safeName.split(/\s+/).filter(Boolean).slice(0, 2);
    const label = parts.map((part) => part[0] || '').join('');
    if (label) return label.toUpperCase();
  }
  return String(phone || 'U').replace(/\D/g, '').slice(-2) || 'U';
}

function ClientProfileDetails() {
  const navigate = useNavigate();
  const auth = useAuth();
  const snapshot = auth?.referralSnapshot || getOwnReferralSnapshot() || null;
  const sourceFullName = String(auth?.profile?.full_name || '').trim();
  const sourcePhone = String(auth?.profile?.phone || auth?.user?.phone || '').trim();
  const [fullName, setFullName] = useState(sourceFullName);
  const [phone, setPhone] = useState(sourcePhone);
  const avatarLabel = useMemo(() => getInitials(fullName || sourceFullName, phone || sourcePhone), [fullName, phone, sourceFullName, sourcePhone]);

  useEffect(() => {
    setFullName(sourceFullName);
    setPhone(sourcePhone);
  }, [sourceFullName, sourcePhone]);
  return (
    <UnigoScreen>
      <UnigoHeader back="/profile" title="Profil ma’lumotlari" subtitle="Rasm, ism va telefon raqami" />
      <UnigoCard>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div className="unigo-avatar" style={{ width: 84, height: 84, fontSize: 24 }}>{avatarLabel}</div>
        </div>
        <div className="unigo-card__stack">
          <UnigoInput label="To‘liq ism-sharif" value={fullName} onChange={setFullName} placeholder="Ism va familiya" />
          <UnigoInput label="Telefon raqam" value={phone} onChange={setPhone} placeholder="+998 XX XXX XX XX" />
          <UnigoButton disabled={!fullName.trim() && !phone.trim()}>Saqlash</UnigoButton>
        </div>
      </UnigoCard>
      <UnigoSection title="Taklif bo‘limi">
        <UnigoCard soft="soft-blue">
          <div className="unigo-card__stack">
            <h3 className="unigo-card-title" style={{ fontSize: 18 }}>Do‘stlarni taklif qilish</h3>
            <p className="unigo-card-caption">Taklif havolasini ulashing va bonus oling.</p>
            <p className="unigo-card-caption" style={{ wordBreak: 'break-all' }}>{String(snapshot?.share_url || '').trim() || 'Taklif havolasi hali tayyor emas'}</p>
            <UnigoButton variant="secondary" onClick={async () => { try { await shareReferralLink({ code: String(snapshot?.code?.code || snapshot?.code || '').trim(), inviterName: fullName || sourceFullName || '', appName: 'UniGo' }); } catch { navigate('/referral'); } }}>Taklif ulashish</UnigoButton>
          </div>
        </UnigoCard>
      </UnigoSection>
    </UnigoScreen>
  );
}

export default memo(ClientProfileDetails);
