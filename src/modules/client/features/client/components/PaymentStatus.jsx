import React, { useMemo } from 'react';
import { useClientText } from '../shared/i18n_clientLocalize';
import Lottie from "lottie-react";
import { Typography, Space } from 'antd';
import { securityAssets } from '@/assets/security';
import { calculationAssets } from '@/assets/calculation';

// Yuklangan fayllarni import qilish (manzilni loyihangizga qarab tekshiring)
const introAnim = "/assets/lottie/sdk_gas_lottie_payment_intro.json";
const progressAnim = "/assets/lottie/sdk_gas_lottie_payment.json";
const connectionAnim = "/assets/lottie/sdk_gas_lottie_connection.json";
const successAnim = "/assets/lottie/sdk_gas_lottie_pay2connect.json";

const { Title, Text } = Typography;

const statusVisualMap = {
  searching: {
    title: "Haydovchi qidirilmoqda...",
    description: "Eng yaqin mashinani aniqlayapmiz",
    icon: 'notifyBellUnread',
    chip: "Live search",
    pricingIcon: calculationAssets.pricing.surgeUp,
  },
  processing: {
    title: "To'lov tekshirilmoqda...",
    description: "Tranzaksiya himoyalangan oqimda tekshirilmoqda",
    icon: 'paymentIconWarning',
    chip: "Secure payment",
    pricingIcon: calculationAssets.payment.details,
  },
  connecting: {
    title: "Ulanish davom etmoqda...",
    description: "Xizmat va to‘lov kanali bog‘lanmoqda",
    icon: 'securityLockOutline',
    chip: "Protected connect",
    pricingIcon: calculationAssets.pricing.fair,
  },
  success: {
    title: "Muvaffaqiyatli yakunlandi!",
    description: "To‘lov tasdiqlandi va buyurtma davom etadi",
    icon: 'trustSuccessIllustration',
    chip: "Verified",
    pricingIcon: calculationAssets.pricing.down,
  },
};

// ✅ Named export ham bo'ldi (ClientOrderCreate.jsx dagi { PaymentStatus } uchun)
export function PaymentStatus({ status }) {
  const { cp } = useClientText();

  const currentAnimation = useMemo(() => {
    const map = {
      searching: introAnim,
      processing: progressAnim,
      connecting: connectionAnim,
      success: successAnim,
    };
    return map[status] || introAnim;
  }, [status]);

  const currentVisual = statusVisualMap[status] || statusVisualMap.searching;
  const currentIcon = securityAssets.notifications[currentVisual.icon]
    || securityAssets.payment[currentVisual.icon]
    || securityAssets.state[currentVisual.icon]
    || securityAssets.trust[currentVisual.icon];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '50px 20px',
      background: 'transparent',
    }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 14, borderRadius: 999, padding: '10px 14px', background: 'rgba(255,255,255,0.72)', boxShadow: '0 12px 28px rgba(15,23,42,0.08)' }}>
        {currentIcon ? <img src={currentIcon} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} /> : null}
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#0f172a' }}>{cp(currentVisual.chip)}</span>
      </div>

      <div style={{ width: 250, height: 250, position: 'relative' }}>
        <Lottie
          animationData={currentAnimation}
          loop={status !== 'success'}
          style={{ width: '100%', height: '100%' }}
        />
        {status === 'success' && securityAssets.trust.trustHumanVerified ? (
          <img
            src={securityAssets.trust.trustHumanVerified}
            alt=""
            style={{ position: 'absolute', right: 12, bottom: 12, width: 52, height: 52, objectFit: 'contain', filter: 'drop-shadow(0 14px 22px rgba(34,197,94,0.22))' }}
          />
        ) : null}
      </div>

      <Space direction="vertical" align="center" style={{ marginTop: 20 }}>
        <Title level={4} style={{ margin: 0, fontFamily: 'AccentHeadline' }}>
          {cp(currentVisual.title)}
        </Title>
        <Text type="secondary">
          {cp(currentVisual.description)}
        </Text>
      </Space>

      <div style={{ marginTop: 16, width: '100%', maxWidth: 420, borderRadius: 22, background: 'rgba(255,255,255,0.82)', boxShadow: '0 12px 28px rgba(15,23,42,0.08)', padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={currentVisual.pricingIcon || calculationAssets.pricing.fair} alt="" style={{ width: 44, height: 44, borderRadius: 14, objectFit: 'cover' }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{cp('To‘lov va narx holati')}</div>
            <div style={{ marginTop: 2, fontSize: 12, lineHeight: '18px', color: '#475569' }}>
              {status === 'processing' ? cp("Narx tafsiloti va usul tekshirilmoqda.") : status === 'success' ? cp("Promo, chegirma yoki final narx natijasi tayyor.") : cp("Aktiv to‘lov oqimi uchun pricing badge tayyor turadi.")}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, width: '100%', maxWidth: 420 }}>
        <StatusHint icon={securityAssets.state.securityLockFill} label={cp("Shielded")} />
        <StatusHint icon={securityAssets.scanner.scanQrCode} label={cp("Track")} />
        <StatusHint icon={securityAssets.trust.trustCertificate} label={cp("Checked")} />
      </div>

      <style>{`
        .lottie-container svg {
          filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.2));
        }
      `}</style>
    </div>
  );
}

function StatusHint({ icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44, borderRadius: 18, background: 'rgba(255,255,255,0.76)', boxShadow: '0 10px 26px rgba(15,23,42,0.06)', padding: '10px 12px' }}>
      {icon ? <img src={icon} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} /> : null}
      <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>{label}</span>
    </div>
  );
}

export default PaymentStatus;
