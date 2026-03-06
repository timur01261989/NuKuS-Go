import React from 'react';
import { Card, InputNumber, Space, Typography, Tooltip, Badge, Divider } from 'antd';
import { 
  UserOutlined, 
  SafetyCertificateOutlined, 
  InboxOutlined, 
  ReconciliationOutlined, 
  CheckCircleFilled 
} from '@ant-design/icons';
import { useDistrict } from '../../context/DistrictContext';

const { Text, Title } = Typography;

const seatOrder = [
  { key: 'FL', short: 'FL' },
  { key: 'FR', short: 'FR' },
  { key: 'RL', short: 'RL' },
  { key: 'RR', short: 'RR' },
];

/**
 * CarSeatVisualizer.jsx
 * -------------------------------------------------------
 * Mashina o'rindiqlari va reys xizmatlarini vizual ko'rsatuvchi komponent.
 *
 */
export default function CarSeatVisualizer() {
  const { state, seats, toggleSeat, setSeatPrice, pricing } = useDistrict();

  // Kontekstdan reys xususiyatlarini olish (TripCreateModal'dan keladi)
  const isFemaleOnly = state?.female_only || false;
  const hasEltish = state?.has_eltish || false;
  const hasYuk = state?.has_yuk || false;

  // Dizayn ranglarini rejimga qarab belgilash
  const primaryColor = isFemaleOnly ? '#eb2f96' : '#52c41a';
  const cardBorderColor = isFemaleOnly ? '#ffadd2' : '#f0f0f0';
  const femaleBg = 'rgba(235, 47, 150, 0.05)';

  return (
    <Card 
      title={
        <Space>
          <span>O‘rindiqlar holati</span>
          {isFemaleOnly && (
            <Badge 
              count={<SafetyCertificateOutlined style={{ color: '#eb2f96' }} />} 
              offset={[5, 0]}
            >
              <Tag color="magenta" style={{ margin: 0 }}>Ayollar uchun</Tag>
            </Badge>
          )}
        </Space>
      }
      style={{ 
        borderRadius: 16, 
        border: `1px solid ${cardBorderColor}`,
        background: isFemaleOnly ? femaleBg : '#fff'
      }}
      bodyStyle={{ padding: '16px' }}
    >
      {/* MASHINA VIZUAL SXEMASI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {seatOrder.map((s) => {
          const seat = seats[s.key];
          
          // O'rindiq holatiga ko'ra ranglar
          let bg = seat.taken ? '#ffccc7' : '#d9f7be';
          let border = seat.taken ? '#ff4d4f' : '#52c41a';

          // Agar ayollar rejimi bo'lsa va o'rindiq bo'sh bo'lsa, rangni o'zgartirish
          if (isFemaleOnly && !seat.taken) {
            bg = '#fff0f6';
            border = '#ffadd2';
          }

          return (
            <div
              key={s.key}
              onClick={() => toggleSeat(s.key)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && toggleSeat(s.key)}
              style={{
                cursor: 'pointer',
                border: `2px solid ${border}`,
                background: bg,
                borderRadius: 14,
                padding: 12,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.3s ease',
                position: 'relative'
              }}
            >
              <div>
                <Space size={4}>
                  <UserOutlined style={{ color: seat.taken ? '#cf1322' : primaryColor }} />
                  <Text strong>{seat.label}</Text>
                </Space>
                <div style={{ fontSize: 12, opacity: 0.75 }}>
                  {seat.taken ? (
                    <span style={{ color: '#cf1322' }}>Band</span>
                  ) : (
                    <span style={{ color: primaryColor }}>Bo‘sh</span>
                  )}
                </div>
              </div>

              <Tooltip title="Ushbu o‘rindiq uchun maxsus narx (so'm)">
                <Space direction="vertical" align="end" size={0} onClick={(e) => e.stopPropagation()}>
                  <Text type="secondary" style={{ fontSize: 10, textTransform: 'uppercase' }}>
                    Narx
                  </Text>
                  <InputNumber
                    min={0}
                    step={5000}
                    value={seat.price}
                    onChange={(v) => setSeatPrice(s.key, v)}
                    style={{ width: 90 }}
                    placeholder={`${pricing.baseSeatPrice}`}
                    bordered={false}
                    className="seat-price-input"
                  />
                </Space>
              </Tooltip>
            </div>
          );
        })}
      </div>

      <Divider style={{ margin: '16px 0 12px 0' }} />

      {/* QO'SHIMCHA XIZMATLAR STATUSI */}
      <div style={{ background: 'rgba(0,0,0,0.02)', padding: '10px', borderRadius: 12 }}>
        <Title level={5} style={{ fontSize: 13, marginBottom: 8, color: '#8c8c8c' }}>
          REYS XIZMATLARI:
        </Title>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', opacity: hasEltish ? 1 : 0.4 }}>
            <Space>
              <InboxOutlined style={{ color: '#1677ff' }} />
              <Text size="small">Eltish (Pochta)</Text>
            </Space>
            {hasEltish ? <Badge status="success" text="Yoqilgan" /> : <Text type="secondary">Yo'q</Text>}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', opacity: hasYuk ? 1 : 0.4 }}>
            <Space>
              <ReconciliationOutlined style={{ color: '#fa8c16' }} />
              <Text size="small">Yuk olaman</Text>
            </Space>
            {hasYuk ? <Badge status="success" text="Yoqilgan" /> : <Text type="secondary">Yo'q</Text>}
          </div>
        </Space>
      </div>

      <div style={{ marginTop: 12, fontSize: 11, color: '#bfbfbf', textAlign: 'center' }}>
        <CheckCircleFilled style={{ color: primaryColor, marginRight: 4 }} />
        O‘rindiqni bosib holatni o'zgartiring
      </div>
    </Card>
  );
}