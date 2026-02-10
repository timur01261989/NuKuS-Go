import React, { useState } from 'react';
import { Input, List, Typography, Card } from 'antd';
import { EnvironmentFilled, SearchOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { NUKUS_PLACES } from '../../utils/NukusPlaces';

const { Text } = Typography;

export default function AddressAutocomplete({ onSelect }) {
  const [results, setResults] = useState([]);

  const handleSearch = (val) => {
    if (val.length > 1) {
      const filtered = NUKUS_PLACES.filter(p => 
        p.name.toLowerCase().includes(val.toLowerCase())
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <Input
        size="large"
        placeholder="Qayerga boramiz?"
        onChange={(e) => handleSearch(e.target.value)}
        prefix={<SearchOutlined style={{ color: '#FFD700' }} />}
        style={{ 
          borderRadius: 16, 
          height: 55, 
          border: 'none', 
          boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
          fontFamily: 'YangoHeadline' 
        }}
      />

      {results.length > 0 && (
        <Card style={{ 
          position: 'absolute', 
          top: 60, 
          width: '100%', 
          zIndex: 1000, 
          borderRadius: 16,
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
        }} bodyStyle={{ padding: 10 }}>
          <List
            dataSource={results}
            renderItem={item => (
              <List.Item 
                onClick={() => { onSelect(item); setResults([]); }}
                style={{ cursor: 'pointer', border: 'none' }}
              >
                <List.Item.Meta
                  avatar={<EnvironmentFilled style={{ color: '#FFD700' }} />}
                  title={<Text strong style={{ fontFamily: 'YangoHeadline' }}>{item.name}</Text>}
                  description={<Text type="secondary" style={{ fontSize: 12 }}>{item.address}</Text>}
                />
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );
}