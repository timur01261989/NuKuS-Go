import React, { useState } from 'react';
import { Modal, Rate, Input, Button, Typography, message } from 'antd';
import { StarFilled } from '@ant-design/icons';
import { supabase } from '../../../pages/supabase';

const { Title, Text } = Typography;

export default function RatingModal({ visible, order, onFinish }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const submitRating = async () => {
    setLoading(true);
    try {
      // 1. Reytingni ratings jadvaliga yozish
      const { error: ratingError } = await supabase.from('ratings').insert([{
        order_id: order.id,
        client_id: order.client_id,
        driver_id: order.driver_id,
        rating_value: rating,
        comment: comment
      }]);

      if (ratingError) throw ratingError;

      // 2. Haydovchining umumiy reytingini yangilash mantiqi (Siz yuklagan rating_update kabi)
      message.success("Bahoingiz uchun rahmat!");
      onFinish();
    } catch (err) {
      message.error("Xatolik: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={visible}
      footer={null}
      closable={false}
      centered
      bodyStyle={{ textAlign: 'center', padding: '30px' }}
    >
      <StarFilled style={{ fontSize: 50, color: '#FFD700', marginBottom: 20 }} />
      <Title level={3}>Safar qanday o'tdi?</Title>
      <Text type="secondary">Haydovchining xizmatini baholang</Text>

      <div style={{ margin: '25px 0' }}>
        <Rate 
          allowHalf={false} 
          value={rating} 
          onChange={setRating} 
          style={{ fontSize: 40, color: '#FFD700' }} 
        />
      </div>

      <Input.TextArea 
        placeholder="Fikringizni qoldiring (ixtiyoriy)..." 
        rows={3} 
        value={comment}
        onChange={e => setComment(e.target.value)}
        style={{ borderRadius: 12, marginBottom: 20 }}
      />

      <Button 
        type="primary" 
        block 
        size="large" 
        loading={loading}
        onClick={submitRating}
        style={{ background: 'black', height: 55, borderRadius: 15, fontWeight: 'bold' }}
      >
        YUBORISH
      </Button>
    </Modal>
  );
}