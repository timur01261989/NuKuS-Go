const PENDING_REFERRAL_STORAGE_KEY = 'unigo_pending_referral_context_v1';
const BROWSER_DEVICE_SEED_KEY = 'unigo_browser_device_seed_v1';

function getSafeWindow() {
  return typeof window !== 'undefined' ? window : null;
}

function getSafeLocalStorage() {
  const safeWindow = getSafeWindow();
  try {
    return safeWindow?.localStorage || null;
  } catch {
    return null;
  }
}

function safeEncode(value) {
  return encodeURIComponent(String(value || '').trim());
}

export function normalizeReferralCode(rawValue) {
  return String(rawValue || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, '')
    .slice(0, 32);
}

export function getShareBaseUrl() {
  const fromEnv = String(import.meta?.env?.VITE_APP_SHARE_BASE_URL || '').trim().replace(/\/$/, '');
  if (fromEnv) {
    return fromEnv;
  }

  const safeWindow = getSafeWindow();
  return String(safeWindow?.location?.origin || '').replace(/\/$/, '');
}

export function buildReferralShareUrl(code) {
  const normalizedCode = normalizeReferralCode(code);
  if (!normalizedCode) {
    return '';
  }

  const baseUrl = getShareBaseUrl();
  if (!baseUrl) {
    return `/r/${normalizedCode}`;
  }

  return `${baseUrl}/r/${normalizedCode}`;
}

export function createPendingReferralContext({
  code,
  source = 'manual',
  shareUrl = '',
  inviter = null,
} = {}) {
  const normalizedCode = normalizeReferralCode(code);
  if (!normalizedCode) {
    return null;
  }

  return {
    code: normalizedCode,
    source: String(source || 'manual').trim() || 'manual',
    share_url: String(shareUrl || buildReferralShareUrl(normalizedCode)).trim(),
    inviter: inviter && typeof inviter === 'object'
      ? {
          user_id: inviter.user_id || null,
          full_name: inviter.full_name || null,
          avatar_url: inviter.avatar_url || null,
        }
      : null,
    captured_at: new Date().toISOString(),
  };
}

export function persistPendingReferralContext(context) {
  const storage = getSafeLocalStorage();
  if (!storage || !context?.code) {
    return null;
  }

  const normalizedContext = createPendingReferralContext(context);
  if (!normalizedContext) {
    return null;
  }

  storage.setItem(PENDING_REFERRAL_STORAGE_KEY, JSON.stringify(normalizedContext));
  return normalizedContext;
}

export function getPendingReferralContext() {
  const storage = getSafeLocalStorage();
  if (!storage) {
    return null;
  }

  try {
    const rawValue = storage.getItem(PENDING_REFERRAL_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue);
    return createPendingReferralContext(parsed);
  } catch {
    return null;
  }
}

export function clearPendingReferralContext() {
  const storage = getSafeLocalStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(PENDING_REFERRAL_STORAGE_KEY);
}

export function extractReferralCodeFromLocation(inputLocation) {
  const safeWindow = getSafeWindow();
  const currentLocation = inputLocation || safeWindow?.location;
  if (!currentLocation) {
    return '';
  }

  try {
    const url = new URL(String(currentLocation.href || currentLocation), safeWindow?.location?.origin || 'http://localhost');
    const refFromQuery = normalizeReferralCode(
      url.searchParams.get('ref') || url.searchParams.get('referral') || url.searchParams.get('code') || ''
    );

    if (refFromQuery) {
      return refFromQuery;
    }

    const pathMatch = url.pathname.match(/\/(?:r|invite)\/([^/?#]+)/i);
    return normalizeReferralCode(pathMatch?.[1] || '');
  } catch {
    return '';
  }
}

export function hydratePendingReferralFromLocation(inputLocation, extra = {}) {
  const code = extractReferralCodeFromLocation(inputLocation);
  if (!code) {
    return null;
  }

  return persistPendingReferralContext({
    code,
    source: extra.source || 'url',
    shareUrl: extra.shareUrl || buildReferralShareUrl(code),
    inviter: extra.inviter || null,
  });
}

export function buildReferralSharePayload({ code, inviterName = '', appName = 'UniGo' } = {}) {
  const normalizedCode = normalizeReferralCode(code);
  const shareUrl = buildReferralShareUrl(normalizedCode);
  const inviterPrefix = inviterName ? `${inviterName} sizni ${appName} ga taklif qildi.` : `${appName} ga qo‘shiling.`;
  const text = `${inviterPrefix} Havola orqali ro‘yxatdan o‘ting: ${shareUrl}`;

  return {
    code: normalizedCode,
    url: shareUrl,
    title: `${appName} — Do‘stingiz taklifi`,
    text,
  };
}

export function getShareCapabilities() {
  const safeWindow = getSafeWindow();
  const navigatorRef = safeWindow?.navigator;
  return {
    hasNavigatorShare: Boolean(navigatorRef?.share),
    hasClipboardWrite: Boolean(navigatorRef?.clipboard?.writeText),
    isSecureContext: Boolean(safeWindow?.isSecureContext),
    isMobileLike: /Android|iPhone|iPad|iPod|Mobile/i.test(String(navigatorRef?.userAgent || '')),
  };
}

async function copyTextToClipboard(text) {
  const safeWindow = getSafeWindow();
  const normalizedText = String(text || '').trim();
  if (!normalizedText) {
    return false;
  }

  try {
    if (safeWindow?.navigator?.clipboard?.writeText) {
      await safeWindow.navigator.clipboard.writeText(normalizedText);
      return true;
    }
  } catch {
    // fallback below
  }

  try {
    const textarea = safeWindow?.document?.createElement('textarea');
    if (!textarea || !safeWindow?.document?.body) {
      return false;
    }
    textarea.value = normalizedText;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    safeWindow.document.body.appendChild(textarea);
    textarea.select();
    const copied = safeWindow.document.execCommand('copy');
    safeWindow.document.body.removeChild(textarea);
    return !!copied;
  } catch {
    return false;
  }
}

export function buildReferralShareTargets({ code, inviterName = '', appName = 'UniGo' } = {}) {
  const payload = buildReferralSharePayload({ code, inviterName, appName });
  if (!payload.url) {
    return [];
  }

  const combinedText = `${payload.text}`.trim();
  const encodedUrl = safeEncode(payload.url);
  const encodedText = safeEncode(combinedText);
  const encodedTitle = safeEncode(payload.title);

  return [
    {
      key: 'telegram',
      label: 'Telegram',
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      mode: 'popup',
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodedText}`,
      mode: 'popup',
    },
    {
      key: 'vk',
      label: 'VK',
      href: `https://vk.com/share.php?url=${encodedUrl}&title=${encodedTitle}&comment=${encodedText}`,
      mode: 'popup',
    },
    {
      key: 'copy',
      label: 'Nusxa olish',
      href: payload.url,
      mode: 'clipboard',
    },
  ];
}

export async function openReferralShareTarget(target) {
  const safeWindow = getSafeWindow();
  if (!target || !target.mode) {
    return { mode: 'unsupported' };
  }

  if (target.mode === 'clipboard') {
    const copied = await copyTextToClipboard(target.href || '');
    return {
      mode: copied ? 'clipboard' : 'unsupported',
      target,
    };
  }

  if (target.mode === 'popup') {
    try {
      if (!safeWindow?.open) {
        return { mode: 'unsupported', target };
      }
      safeWindow.open(String(target.href || ''), '_blank', 'noopener,noreferrer');
      return {
        mode: 'popup',
        target,
      };
    } catch {
      return { mode: 'unsupported', target };
    }
  }

  return { mode: 'unsupported', target };
}

export async function shareReferralLink({ code, inviterName = '', appName = 'UniGo' } = {}) {
  const safeWindow = getSafeWindow();
  const payload = buildReferralSharePayload({ code, inviterName, appName });

  if (!payload.url) {
    throw new Error('Referral link tayyor emas');
  }

  if (safeWindow?.navigator?.share) {
    try {
      await safeWindow.navigator.share({
        title: payload.title,
        text: payload.text,
        url: payload.url,
      });
      return {
        mode: 'native-share',
        payload,
      };
    } catch (error) {
      if (String(error?.name || '') === 'AbortError') {
        return {
          mode: 'cancelled',
          payload,
        };
      }
    }
  }

  const copied = await copyTextToClipboard(payload.url);
  return {
    mode: copied ? 'clipboard' : 'unsupported',
    payload,
  };
}

async function ensureBrowserDeviceSeed() {
  const storage = getSafeLocalStorage();
  if (!storage) {
    return 'browser-anon';
  }

  const existing = storage.getItem(BROWSER_DEVICE_SEED_KEY);
  if (existing) {
    return existing;
  }

  const generated = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  storage.setItem(BROWSER_DEVICE_SEED_KEY, generated);
  return generated;
}

async function sha256Hex(input) {
  const safeWindow = getSafeWindow();
  const value = String(input || '');
  if (!value) {
    return '';
  }

  try {
    if (safeWindow?.crypto?.subtle && safeWindow?.TextEncoder) {
      const encoded = new safeWindow.TextEncoder().encode(value);
      const digest = await safeWindow.crypto.subtle.digest('SHA-256', encoded);
      return Array.from(new Uint8Array(digest))
        .map((item) => item.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    // fallback below
  }

  return value;
}

export async function getReferralDeviceHash() {
  const safeWindow = getSafeWindow();
  const deviceMeta = {
    platform: safeWindow?.navigator?.userAgent?.includes('wv') ? 'android-webview' : 'web',
    device_id: null,
    app_version: null,
  };
  const browserSeed = await ensureBrowserDeviceSeed();
  const rawFingerprint = [
    deviceMeta?.platform || 'web',
    deviceMeta?.device_id || browserSeed,
    safeWindow?.navigator?.userAgent || 'unknown-agent',
    safeWindow?.navigator?.language || 'unknown-lang',
  ].join('|');

  const hashed = await sha256Hex(rawFingerprint);
  return hashed || rawFingerprint;
}

const referralLinkService = {
  normalizeReferralCode,
  getShareBaseUrl,
  buildReferralShareUrl,
  createPendingReferralContext,
  persistPendingReferralContext,
  getPendingReferralContext,
  clearPendingReferralContext,
  extractReferralCodeFromLocation,
  hydratePendingReferralFromLocation,
  buildReferralSharePayload,
  getShareCapabilities,
  buildReferralShareTargets,
  openReferralShareTarget,
  shareReferralLink,
  getReferralDeviceHash,
};

export default referralLinkService;
