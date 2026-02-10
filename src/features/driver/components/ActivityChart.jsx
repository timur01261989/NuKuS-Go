import React, { useEffect, useState } from 'react';
import { Card, Typography, Spin } from 'antd';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from "../../../lib/supabase";

const { Title, Text } = Typography;

export default function ActivityChart({ driverId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const { data: history } = await supabase
        .from('activity_history')
        .select('created_at, new_balance')
        .eq('driver_id', driverId)
        .order('created_at', { ascending: true })
        .limit(10);

      if (history) {
        const chartData = history.map(item => ({
          time: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          points: item.new_balance
        }));
        setData(chartData);
      }
      setLoading(false);
    };
    fetchHistory();
  }, [driverId]);

  if (loading) return <Spin size="small" />;

  return (
    <Card style={{ borderRadius: 20, marginTop: 20, border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
      <Title level={5} style={{ marginBottom: 20 }}>Faollik dinamikasi</Title>
      <div style={{ width: '100%', height: 200 }}>
        <ResponsiveContainer>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#faad14" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#faad14" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
            <XAxis dataKey="time" hide />
            <YAxis domain={['dataMin - 5', 'dataMax + 5']} hide />
            <Tooltip />
            <Area 
              type="monotone" 
              dataKey="points" 
              stroke="#faad14" 
              fillOpacity={1} 
              fill="url(#colorPoints)" 
              strokeWidth={3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <Text type="secondary" style={{ fontSize: 12 }}>Oxirgi 10 ta safar bo'yicha tahlil</Text>
    </Card>
  );
}