import React, { memo, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/shared/auth/AuthProvider.jsx';
import { getOwnReferralSnapshot, shareReferralLink } from '@/services/referralLinkService.js';
import { UnigoButton, UnigoCard, UnigoHeader, UnigoInput, UnigoScreen, UnigoSection } from '@/modules/shared/ui/UnigoMobileUI.jsx';
import { securityAssets } from '@/assets/security';

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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 20 }}>
          <div className="unigo-soft-card" style={{ padding: 12, textAlign: 'left' }}>
            <img src={securityAssets.auth.authIconPhone} alt="" style={{ width: 20, height: 20, objectFit: 'contain', marginBottom: 8 }} />
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', opacity: 0.68 }}>Phone</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Verified</div>
          </div>
          <div className="unigo-soft-card" style={{ padding: 12, textAlign: 'left' }}>
            <img src={securityAssets.auth.authIconDocument} alt="" style={{ width: 20, height: 20, objectFit: 'contain', marginBottom: 8 }} />
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', opacity: 0.68 }}>Profile</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Ready</div>
          </div>
          <div className="unigo-soft-card" style={{ padding: 12, textAlign: 'left' }}>
            <img src={securityAssets.trust.trustCertificate} alt="" style={{ width: 20, height: 20, objectFit: 'contain', marginBottom: 8 }} />
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', opacity: 0.68 }}>Trust</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Safe</div>
          </div>
        </div>
        <div className="unigo-card__stack">
          <UnigoInput label="To‘liq ism-sharif" value={fullName} onChange={setFullName} placeholder="Ism va familiya" />
          <UnigoInput label="Telefon raqam" value={phone} onChange={setPhone} placeholder="+998 XX XXX XX XX" />
          <UnigoButton disabled={!fullName.trim() && !phone.trim()}>Saqlash</UnigoButton>
        </div>
      </UnigoCard>
      <UnigoSection title="Tasdiqlash va himoya">
        <UnigoCard soft="soft-blue">
          <div className="unigo-card__stack">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src={securityAssets.auth.authMaskSelfieDocument} alt="" style={{ width: 56, height: 56, objectFit: 'contain' }} />
              <div>
                <h3 className="unigo-card-title" style={{ fontSize: 18 }}>Selfie va hujjat</h3>
                <p className="unigo-card-caption">Profilni kuchaytirish uchun document/selfie oqimlari uchun vizual qatlam tayyor.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <span className="unigo-chip"><img src={securityAssets.state.securityLockOutline} alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} /> Secure</span>
              <span className="unigo-chip"><img src={securityAssets.notifications.notifyBellUnread} alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} /> Alerts</span>
              <span className="unigo-chip"><img src={securityAssets.scanner.scanQr} alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} /> QR ready</span>
            </div>
          </div>
        </UnigoCard>
      </UnigoSection>
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
