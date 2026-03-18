export function getInitialReferralSummaryState(getOwnReferralSnapshot) {
  const cached = getOwnReferralSnapshot();
  return {
    code: cached?.code ? { code: cached.code } : null,
    summary: cached?.summary || null,
    shareUrl: cached?.share_url || '',
    wallet: cached?.wallet || null,
    warnings: [],
  };
}

export function buildReferralViewModel(summaryState, buildReferralShareUrl, buildReferralSharePayload, buildReferralExternalShareTargets) {
  const referralCode = String(summaryState?.code?.code || summaryState?.code || '').trim();
  const shareUrl = String(summaryState?.shareUrl || '').trim() || buildReferralShareUrl(referralCode);
  const sharePayload = buildReferralSharePayload({ code: referralCode, appName: 'UniGo' });
  const externalTargets = buildReferralExternalShareTargets({ code: referralCode, appName: 'UniGo' });
  const canShare = Boolean(referralCode && shareUrl);

  const totals = {
    invitedCount: Number(summaryState?.summary?.totals?.invited_count || 0),
    qualifiedCount: Number(summaryState?.summary?.totals?.qualified_count || 0),
    rewardedCount: Number(summaryState?.summary?.totals?.rewarded_count || 0),
    earnedUzs: Number(summaryState?.summary?.totals?.earned_uzs || summaryState?.wallet?.balance_uzs || 0),
  };

  const rewardRows = Array.isArray(summaryState?.summary?.rewards)
    ? summaryState.summary.rewards.slice(0, 10)
    : [];

  return {
    referralCode,
    shareUrl,
    sharePayload,
    externalTargets,
    canShare,
    totals,
    rewardRows,
  };
}

export function buildInlineStatusText({ loading, codeStatus, errorText, tr }) {
  if (loading) return tr('Yuklanmoqda…');
  if (errorText) return errorText;
  if (codeStatus === 'missing') return tr('Sizda hali referral kod mavjud emas');
  if (codeStatus === 'partial') return tr('Kod tayyor, lekin batafsil ma’lumot to‘liq emas');
  if (codeStatus === 'ready') return tr('Referral tizimi tayyor');
  return '';
}

export function buildWarningsText(summaryState) {
  const warnings = Array.isArray(summaryState?.warnings) ? summaryState.warnings.filter(Boolean) : [];
  return warnings.length ? warnings.join(' • ') : '';
}
