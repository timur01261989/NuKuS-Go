import React from 'react';
import { Segmented, Space, Typography } from 'antd';
import { useDistrict } from '../../context/DistrictContext';

const { Text } = Typography;

export default function ModeSwitchToggle() {
  const { mode, MODES, setMode } = useDistrict();

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Text strong>Rejim</Text>
      <Segmented
        block
        value={mode}
        onChange={(v) => setMode(v)}
        options={[
          { label: 'Standart (Pitak)', value: MODES.STANDARD },
          { label: 'Premium (Eshikdan)', value: MODES.PREMIUM },
        ]}
      />
    </Space>
  );
}
