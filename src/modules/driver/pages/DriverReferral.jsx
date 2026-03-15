import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/modules/shared/auth/AuthProvider.jsx';
import { bootstrapReferralSummary } from '@/services/referralApi.js';
import { buildReferralSharePayload, getOwnReferralSnapshot, persistOwnReferralSnapshot, shareReferralLink } from '@/services/referralLinkService.js';
import { UnigoButton, UnigoCard, UnigoEmptyState, UnigoHeader, UnigoKpiGrid, UnigoListRow, UnigoScreen, UnigoSection } from '@/modules/shared/ui/UnigoMobileUI.jsx';

function formatMoney(value) {
  const amount = Number(value || 0);
  return `${amount.toLocaleString('uz-UZ')} so‘m`;
}

async function copyText(text) {
  if (!text) throw new Error('Taklif havolasi tayyor emas');
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', 'readonly');
  area.style.position = 'absolute';
  area.style.left = '-9999px';
  document.body.appendChild(area);
  area.select();
  document.execCommand('copy');
  document.body.removeChild(area);
}

function DriverReferralPage() {
  const auth = useAuth();
  const [snapshot, setSnapshot] = useState(() => auth?.referralSnapshot || getOwnReferralSnapshot() || null);
  const [busy, setBusy] = useState(false);
  const [statusText, setStatusText] = useState('');

  useEffect(() => {
    if (auth?.referralSnapshot) {
      setSnapshot(auth.referralSnapshot);
    }
  }, [auth?.referralSnapshot]);

  const referralCode = String(snapshot?.code?.code || snapshot?.code || '').trim();
  const shareUrl = String(snapshot?.share_url || '').trim();
  const summary = snapshot?.summary || { referrals: [], rewards: [], totals: {} };
  const totals = summary?.totals || {};
  const rewards = Array.isArray(summary?.rewards) ? summary.rewards : [];
  const referrals = Array.isArray(summary?.referrals) ? summary.referrals : [];
  const inviterName = String(auth?.profile?.full_name || '').trim();

  const stats = useMemo(() => ([
    { label: 'Taklif qilinganlar', value: String(Number(totals?.invited_count || 0)) },
    { label: 'Faol bo‘lganlar', value: String(Number(totals?.qualified_count || 0)) },
    { label: 'Mukofot yozilganlar', value: String(Number(totals?.rewarded_count || 0)) },
    { label: 'Mukofot summasi', value: formatMoney(totals?.earned_uzs || 0) },
  ]), [totals]);

  const handleRefresh = useCallback(async () => {
    setBusy(true);
    setStatusText('');
    try {
      const response = await bootstrapReferralSummary();
      const persisted = persistOwnReferralSnapshot(response) || response;
      setSnapshot(persisted);
      setStatusText('Taklif ma’lumotlari yangilandi');
    } catch {
      setStatusText('Server xatosi yuz berdi');
    } finally {
      setBusy(false);
    }
  }, []);

  const handleShare = useCallback(async () => {
    setBusy(true);
    setStatusText('');
    try {
      await shareReferralLink({ code: referralCode, inviterName, appName: 'UniGo' });
      setStatusText('Taklif havolasi tayyorlandi');
    } catch {
      try {
        const payload = buildReferralSharePayload({ code: referralCode, inviterName, appName: 'UniGo' });
        await copyText(payload.text || payload.shareUrl || shareUrl);
        setStatusText('Taklif matni nusxalandi');
      } catch {
        setStatusText('Taklif havolasi tayyor emas');
      }
    } finally {
      setBusy(false);
    }
  }, [inviterName, referralCode, shareUrl]);

  const handleCopy = useCallback(async () => {
    setBusy(true);
    setStatusText('');
    try {
      await copyText(shareUrl || referralCode);
      setStatusText('Taklif havolasi nusxalandi');
    } catch {
      setStatusText('Taklif havolasi tayyor emas');
    } finally {
      setBusy(false);
    }
  }, [referralCode, shareUrl]);

  return (
    <UnigoScreen dark>
      <UnigoHeader dark back="/driver" title="Do‘stlarni taklif qilish" subtitle="Haydovchi kodi va mukofotlar" />
      <UnigoCard dark>
        <div className="unigo-card__stack">
          <span className="unigo-pill unigo-pill--orange">Taklif kodi</span>
          <h2 className="unigo-card-title" style={{ color: 'white', fontSize: 30 }}>{referralCode || 'Kod tayyorlanmoqda'}</h2>
          <p className="unigo-card-caption unigo-card-caption--dark">Tasdiqlangan takliflar bo‘yicha mukofotlar shu bo‘limda ko‘rinadi.</p>
          {shareUrl ? <p className="unigo-card-caption unigo-card-caption--dark" style={{ wordBreak: 'break-all' }}>{shareUrl}</p> : null}
        </div>
      </UnigoCard>
      <div className="unigo-buttons" style={{ marginTop: 20 }}>
        <UnigoButton icon="share" onClick={handleShare} disabled={busy || !referralCode}>Taklif ulashish</UnigoButton>
        <UnigoButton variant="dark-secondary" icon="content_copy" onClick={handleCopy} disabled={busy || (!shareUrl && !referralCode)}>Havolani nusxalash</UnigoButton>
      </div>
      {statusText ? <div style={{ marginTop: 12 }}><span className="unigo-pill unigo-pill--info">{statusText}</span></div> : null}
      <UnigoSection title="Natijalar">
        <UnigoKpiGrid dark items={stats} />
      </UnigoSection>
      <UnigoSection title="Mukofotlar">
        {rewards.length ? (
          <div className="unigo-list">
            {rewards.slice(0, 10).map((reward) => (
              <UnigoListRow
                key={reward.id || `${reward.created_at}-${reward.amount_uzs}`}
                dark
                icon="emoji_events"
                title={reward.reward_type === 'driver_milestone' ? 'Haydovchi mukofoti' : 'Taklif mukofoti'}
                description={reward.created_at ? new Date(reward.created_at).toLocaleString('uz-UZ') : 'Mukofot yozildi'}
                value={`+${formatMoney(reward.amount_uzs || 0)}`}
              />
            ))}
          </div>
        ) : (
          <UnigoEmptyState dark title="Hozircha mukofot yo‘q" description="Takliflaringiz tasdiqlangach mukofotlar shu yerda ko‘rinadi." />
        )}
      </UnigoSection>
      <UnigoSection title="Takliflar holati">
        {referrals.length ? (
          <div className="unigo-list">
            {referrals.slice(0, 10).map((referral) => (
              <UnigoListRow
                key={referral.id || `${referral.referred_user_id}-${referral.created_at}`}
                dark
                icon="group"
                title={referral.status === 'rewarded' ? 'Mukofot yozilgan' : referral.status === 'qualified' ? 'Faollashgan' : 'Kutilmoqda'}
                description={referral.created_at ? new Date(referral.created_at).toLocaleString('uz-UZ') : 'Taklif yaratildi'}
                value={referral.status === 'rewarded' ? 'Yakunlangan' : referral.status === 'qualified' ? 'Faol' : 'Jarayonda'}
              />
            ))}
          </div>
        ) : (
          <UnigoEmptyState dark title="Takliflar hali yo‘q" description="Taklif havolasini yuborsangiz natijalar shu yerda ko‘rinadi." actionLabel="Taklif ulashish" onAction={handleShare} />
        )}
      </UnigoSection>
      <UnigoButton variant="dark-secondary" icon="sync" onClick={handleRefresh} disabled={busy}>Yangilash</UnigoButton>
    </UnigoScreen>
  );
}

export default memo(DriverReferralPage);
