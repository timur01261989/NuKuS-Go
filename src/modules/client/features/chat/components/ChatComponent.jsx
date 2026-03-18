import React, { useState, useEffect, useRef } from 'react';
import { Drawer, Input, Button, List, Typography, Space, Avatar } from 'antd';
import { supportAssets } from '@/assets/support';
import { orderAssets } from '@/assets/order';
import { assetSizes, assetStyles } from '@/assets/assetPolish';
import { realtimeAssets } from '@/assets/realtime';
import { supabase } from '@/services/supabase/supabaseClient';
import { useLanguage } from '@/modules/shared/i18n/useLanguage';

const { Text } = Typography;

const ATTACHMENT_ACTIONS = [
  { key: 'ride', icon: realtimeAssets.chat.chatAttachmentRide || orderAssets.chat.chatAttachmentRide, label: 'Safar' },
  { key: 'location', icon: realtimeAssets.chat.chatAttachmentLocation || orderAssets.chat.chatAttachmentLocation, label: 'Joylashuv' },
  { key: 'camera', icon: realtimeAssets.chat.chatAttachmentCamera || orderAssets.chat.chatAttachmentCamera, label: 'Kamera' },
  { key: 'media', icon: realtimeAssets.chat.chatAttachmentMedia || orderAssets.chat.chatAttachmentMedia, label: 'Media' },
];

export default function ChatComponent({ orderId, userId, visible, onClose }) {
  const { tr } = useLanguage();
  const QUICK_REPLIES = [
    tr('chat.quick.onMyWay', 'Chiqyapman'),
    tr('chat.quick.whereAreYou', 'Qayerdasiz?'),
    tr('chat.quick.atEntrance', 'Kirish oldidaman'),
    tr('chat.quick.arrivingSoon', 'Hozir yetib boraman'),
  ];
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);
  const scrollRef = useRef(null);

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

    const channel = supabase.channel(`order-chat-${orderId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `order_id=eq.${orderId}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [orderId, visible]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const { error } = await supabase.from('messages').insert([{
      order_id: orderId,
      sender_id: userId,
      text,
    }]);
    if (!error) {
      setInputValue('');
      setShowAttachments(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Drawer
      title={(
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Avatar src={realtimeAssets.chat.chatCreateThread || orderAssets.chat.chatCreate || supportAssets.chat.create} shape="square" size={assetSizes.chatAvatar} />
            <span>{tr('chat.titleWithDriver', 'Haydovchi bilan chat')}</span>
          </Space>
          <img src={realtimeAssets.chat.chatRatingStars || orderAssets.chat.chatRatingStars || supportAssets.chat.ratingStars} alt="" style={assetStyles.supportRatingStars} />
          <Space>
            <Button size="small" icon={<img src={realtimeAssets.support.supportCallQuick || orderAssets.chat.chatSupportPhone || supportAssets.chat.chatCallMain || supportAssets.chat.call} alt="" style={assetStyles.chatAction} />} />
            <Button size="small" icon={<img src={realtimeAssets.chat.chatVideoAction || orderAssets.chat.chatVideo || supportAssets.chat.video} alt="" style={assetStyles.chatAction} />} />
          </Space>
        </Space>
      )}
      placement="bottom"
      height="70vh"
      onClose={onClose}
      open={visible}
      bodyStyle={{ display: 'flex', flexDirection: 'column', padding: '10px' }}
    >
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: 15 }}>
        <List
          dataSource={messages}
          renderItem={(msg) => (
            <div
              style={{
                textAlign: msg.sender_id === userId ? 'right' : 'left',
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  padding: '10px 15px',
                  borderRadius: '18px',
                  background: msg.sender_id === userId ? '#000' : '#f0f0f0',
                  color: msg.sender_id === userId ? '#fff' : '#000',
                  maxWidth: '80%',
                }}
              >
                <Text style={{ color: 'inherit' }}>{msg.text}</Text>
                <div style={{ fontSize: '10px', opacity: 0.6, marginTop: 5, display: 'flex', alignItems: 'center', justifyContent: msg.sender_id === userId ? 'flex-end' : 'flex-start', gap: 5 }}>
                  <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {msg.sender_id === userId && (
                    <img
                      src={(msg.read_at || msg.is_read) ? (realtimeAssets.chat.chatMessageRead || orderAssets.chat.chatRead || supportAssets.chat.read) : (realtimeAssets.chat.chatMessageUnread || orderAssets.chat.chatUnread || supportAssets.chat.unread)}
                      alt=""
                      style={{ ...assetStyles.chatMetaIcon, display: 'inline-block' }}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        />
        <div ref={scrollRef} />
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 10 }}>
        {QUICK_REPLIES.map((reply) => (
          <Button key={reply} shape="round" size="small" onClick={() => sendMessage(reply)}>
            {reply}
          </Button>
        ))}
        <Button
          shape="round"
          size="small"
          icon={<img src={realtimeAssets.chat.chatJumpLastMessage || orderAssets.chat.chatJumpLastMessage} alt="" style={assetStyles.chatAction} />}
          onClick={() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' })}
        >
          Pastga
        </Button>
      </div>

      {showAttachments ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, paddingBottom: 12 }}>
          {ATTACHMENT_ACTIONS.map((item) => (
            <Button
              key={item.key}
              type="default"
              style={{ height: 72, borderRadius: 16 }}
              onClick={() => setInputValue((prev) => (prev ? `${prev} ` : '') + `[${item.label}]`)}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <img src={item.icon} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                <span style={{ fontSize: 12 }}>{item.label}</span>
              </div>
            </Button>
          ))}
        </div>
      ) : null}

      <Space.Compact style={{ width: '100%', marginTop: 5 }}>
        <Button
          size="large"
          icon={<img src={realtimeAssets.chat.chatAttach || orderAssets.chat.chatAttach || supportAssets.attachments.ride || supportAssets.chat.attach} alt="attach" style={assetStyles.chatAction} />}
          style={{ borderRadius: '12px 0 0 12px' }}
          onClick={() => setShowAttachments((prev) => !prev)}
        />
        <Input
          size="large"
          placeholder={tr('chat.writeMessage', 'Xabar yozing...')}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onPressEnter={() => sendMessage(inputValue)}
          style={{ borderRadius: 0 }}
        />
        <Button
          type="primary"
          size="large"
          icon={<img src={inputValue.trim() ? (realtimeAssets.chat.chatSendMessage || orderAssets.chat.chatSend || supportAssets.chat.send) : (realtimeAssets.chat.chatSendMessageDisabled || orderAssets.chat.chatSendDisabled || supportAssets.chat.sendDisabled)} alt="send" style={assetStyles.chatAction} />}
          onClick={() => sendMessage(inputValue)}
          style={{ background: '#000', border: 'none', borderRadius: '0 12px 12px 0' }}
        />
      </Space.Compact>
    </Drawer>
  );
}
