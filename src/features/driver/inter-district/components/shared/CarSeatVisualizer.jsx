import React from 'react';
import { Card, InputNumber, Space, Typography, Tooltip } from 'antd';
import { useDistrict } from '../../context/DistrictContext';

const { Text } = Typography;

const seatOrder = [
  { key: 'FL', short: 'FL' },
  { key: 'FR', short: 'FR' },
  { key: 'RL', short: 'RL' },
  { key: 'RR', short: 'RR' },
];

export default function CarSeatVisualizer() {
  const { seats, toggleSeat, setSeatPrice, pricing } = useDistrict();

  return (
    <Card title="O‘rindiqlar" style={{ borderRadius: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
        {seatOrder.map((s) => {
          const seat = seats[s.key];
          const bg = seat.taken ? '#ffccc7' : '#d9f7be';
          const border = seat.taken ? '#ff4d4f' : '#52c41a';

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
              }}
            >
              <div>
                <Text strong>{seat.label}</Text>
                <div style={{ fontSize: 12, opacity: 0.75 }}>{seat.taken ? 'Band' : 'Bo‘sh'}</div>
              </div>

              <Tooltip title="Alohida narx (0 bo‘lsa umumiy tarif ishlaydi)">
                <Space direction="vertical" align="end" size={0} onClick={(e) => e.stopPropagation()}>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Narx
                  </Text>
                  <InputNumber
                    min={0}
                    step={1000}
                    value={seat.price}
                    onChange={(v) => setSeatPrice(s.key, v)}
                    style={{ width: 110 }}
                    placeholder={`${pricing.baseSeatPrice}`}
                  />
                </Space>
              </Tooltip>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 12, fontSize: 12, opacity: 0.8 }}>
        Eslatma: O‘rindiqqa bosing — band/bo‘sh. Narxni alohida qo‘ysangiz, shu o‘rindiq uchun alohida tarif ishlaydi.
      </div>
    </Card>
  );
}
