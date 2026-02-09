import React, { useMemo } from 'react';
import Lottie from "lottie-react";
import { Typography, Space } from 'antd';

// Yuklangan fayllarni import qilish (manzilni loyihangizga qarab tekshiring)
import introAnim from "../../assets/lottie/sdk_gas_lottie_payment_intro.json";
import progressAnim from "../../assets/lottie/sdk_gas_lottie_payment.json";
import connectionAnim from "../../assets/lottie/sdk_gas_lottie_connection.json";
import successAnim from "../../assets/lottie/sdk_gas_lottie_pay2connect.json";

const { Title, Text } = Typography;

export default function PaymentStatus({ status }) {

  // Statusga qarab qaysi animatsiyani ko'rsatishni aniqlash
  const currentAnimation = useMemo(() => {
    const map = {
      'searching': introAnim,
      'processing': progressAnim,
      'connecting': connectionAnim,
      'success': successAnim
    };
    return map[status] || introAnim;
  }, [status]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '50px 20px',
      background: 'transparent'
    }}>
      {/* Animatsiya konteyneri - o'lchamlari cheklangan */}
      <div style={{ width: 250, height: 250, position: 'relative' }}>
        <Lottie 
          animationData={currentAnimation}
          loop={status !== 'success'}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      <Space direction="vertical" align="center" style={{ marginTop: 20 }}>
        <Title level={4} style={{ margin: 0, fontFamily: 'YangoHeadline' }}>
          {status === 'searching' && "Haydovchi qidirilmoqda..."}
          {status === 'processing' && "To'lov tekshirilmoqda..."}
          {status === 'success' && "Muvaffaqiyatli yakunlandi!"}
        </Title>
        <Text type="secondary">
          {status === 'searching' ? "Eng yaqin mashinani aniqlayapmiz" : "Iltimos, kutib turing"}
        </Text>
      </Space>

      <style>{`
        /* HDR effekt berish uchun */
        .lottie-container svg {
          filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.2));
        }
      `}</style>
    </div>
  );
}