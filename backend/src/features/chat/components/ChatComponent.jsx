import React, { useState, useEffect, useRef } from 'react';
import { Drawer, Input, Button, List, Typography, Badge, Space } from 'antd';
import { SendOutlined, CheckOutlined, MessageOutlined } from '@ant-design/icons';
import { supabase } from '../../../lib/supabase';

const { Text } = Typography;

// Yango-style tayyor shablonlar
const QUICK_REPLIES = ["Chiqyapman", "Qayerdasiz?", "Kirish oldidaman", "Hozir yetib boraman"];

export default function ChatComponent({ orderId, userId, visible, onClose }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef(null);
  // 1. XABARLARNI YUKLASH VA REAL-TIME KUZATISH
  useEffect(() => {
    if (!orderId || !visible) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };

    fetchMessages();

    // Messaging Event Real-time kanali
    const channel = supabase.channel(`order-chat-${orderId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages', 
        filter: `order_id=eq.${orderId}` 
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [orderId, visible]);

  // 2. XABAR YUBORISH
  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const { error } = await supabase.from('messages').insert([{
      order_id: orderId,
      sender_id: userId,
      text: text
    }]);
    if (!error) setInputValue("");
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Drawer
      title="Haydovchi bilan chat"
      placement="bottom"
      height="70vh"
      onClose={onClose}
      open={visible}
      bodyStyle={{ display: 'flex', flexDirection: 'column', padding: '10px' }}
    >
      {/* XABARLAR RO'YXATI */}
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: 15 }}>
        <List
          dataSource={messages}
          renderItem={msg => (
            <div style={{ 
              textAlign: msg.sender_id === userId ? 'right' : 'left', 
              marginBottom: 10 
            }}>
              <div style={{ 
                display: 'inline-block', 
                padding: '10px 15px', 
                borderRadius: '18px', 
                background: msg.sender_id === userId ? '#000' : '#f0f0f0', 
                color: msg.sender_id === userId ? '#fff' : '#000',
                maxWidth: '80%'
              }}>
                <Text style={{ color: 'inherit' }}>{msg.text}</Text>
                <div style={{ fontSize: '10px', opacity: 0.6, marginTop: 5 }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {msg.sender_id === userId && <CheckOutlined style={{ marginLeft: 5 }} />}
                </div>
              </div>
            </div>
          )}
        />
        <div ref={scrollRef} />
      </div>

      {/* TAYYOR XABARLAR */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10 }}>
        {QUICK_REPLIES.map(reply => (
          <Button key={reply} shape="round" size="small" onClick={() => sendMessage(reply)}>
            {reply}
          </Button>
        ))}
      </div>

      {/* INPUT QISMI */}
      <Space.Compact style={{ width: '100%', marginTop: 5 }}>
        <Input 
          size="large" 
          placeholder="Xabar yozing..." 
          value={inputValue} 
          onChange={e => setInputValue(e.target.value)}
          onPressEnter={() => sendMessage(inputValue)}
          style={{ borderRadius: '12px 0 0 12px' }}
        />
        <Button 
          type="primary" 
          size="large" 
          icon={<SendOutlined />} 
          onClick={() => sendMessage(inputValue)}
          style={{ background: '#000', border: 'none', borderRadius: '0 12px 12px 0' }}
        />
      </Space.Compact>
    </Drawer>
  );
}