/**
 * PromoModal.jsx
 * E'lonni TOP-ga chiqarish va reklamani boshqarish modali.
 * To'liq funksional: Balansni tekshirish va xizmatlarni yoqish.
 */
import React, { useState } from "react";
import { Modal, Button, Card, Radio, Space, Divider, message, Tag } from "antd";
import { 
  ThunderboltOutlined, 
  ArrowUpOutlined, 
  CheckCircleOutlined, 
  WalletOutlined,
  FireOutlined
} from "@ant-design/icons";
import { promoteAd } from "../../services/marketBackend";
import useWalletBalance from "../../hooks/useWalletBalance";

const PROMO_TYPES = [
  {
    id: "top",
    title: "TOP-ga chiqarish",
    desc: "E'loningiz 3 kun davomida ro'yxatning eng yuqorisida turadi.",
    price: 15000,
    color: "#0ea5e9",
    icon: <ArrowUpOutlined />
  },
  {
    id: "vip",
    title: "VIP Status",
    desc: "E'lon oltin rangli ramka bilan ajralib turadi va ko'p ko'riladi.",
    price: 25000,
    color: "#f59e0b",
    icon: <FireOutlined />
  },
  {
    id: "turbo",
    title: "Turbo Sotuv",
    desc: "Ikkala xizmat birgalikda + Telegram kanalga chiqarish.",
    price: 50000,
    color: "#7c3aed",
    icon: <ThunderboltOutlined />
  }
];

export default function PromoModal({ open, onClose, adId, onNeedTopup }) {
  const [selected, setSelected] = useState("top");
  const [loading, setLoading] = useState(false);
  const { balance, refreshBalance } = useWalletBalance();

  const currentOption = PROMO_TYPES.find(p => p.id === selected);

  const handleApply = async () => {
    // Balansni tekshirish
    if (balance < currentOption.price) {
      message.warning("Balansingizda mablag' yetarli emas");
      if (onNeedTopup) onNeedTopup();
      return;
    }

    try {
      setLoading(true);
      await promoteAd(adId, selected);
      message.success("✅ Xizmat muvaffaqiyatli yoqildi!");
      await refreshBalance();
      onClose();
    } catch (e) {
      message.error(e?.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={380}
      styles={{ body: { padding: "24px 20px" } }}
      style={{ borderRadius: 20, overflow: 'hidden' }}
    >
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ 
          width: 60, height: 60, background: '#eff6ff', borderRadius: 20, 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 12px'
        }}>
          <ThunderboltOutlined style={{ fontSize: 30, color: '#3b82f6' }} />
        </div>
        <div style={{ fontWeight: 900, fontSize: 20, color: '#0f172a' }}>E'lonni tezroq soting</div>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
          Xizmatlardan birini tanlang va mijozlar oqimini oshiring
        </div>
      </div>

      <Radio.Group 
        value={selected} 
        onChange={e => setSelected(e.target.value)} 
        style={{ width: '100%' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          {PROMO_TYPES.map(item => (
            <Card 
              key={item.id}
              hoverable
              onClick={() => setSelected(item.id)}
              style={{ 
                borderRadius: 16, 
                border: selected === item.id ? `2px solid ${item.color}` : '1px solid #f1f5f9',
                background: selected === item.id ? `${item.color}05` : '#fff',
                transition: 'all 0.2s'
              }}
              styles={{ body: { padding: 12 } }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Radio value={item.id} />
                <div style={{ 
                    width: 36, height: 36, background: `${item.color}15`, 
                    color: item.color, borderRadius: 10, display: 'flex', 
                    alignItems: 'center', justifyContent: 'center', fontSize: 18 
                }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{item.title}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.desc}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 900, fontSize: 14, color: '#0f172a' }}>
                    {item.price.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>UZS</div>
                </div>
              </div>
            </Card>
          ))}
        </Space>
      </Radio.Group>

      <Divider style={{ margin: '20px 0' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <WalletOutlined style={{ color: '#64748b' }} />
          <span style={{ fontSize: 13, color: '#64748b' }}>Sizning balansingiz:</span>
        </div>
        <div style={{ fontWeight: 800 }}>{balance?.toLocaleString()} UZS</div>
      </div>

      <Button 
        type="primary" 
        block 
        size="large" 
        loading={loading}
        onClick={handleApply}
        style={{ 
          height: 50, borderRadius: 14, fontWeight: 700, 
          background: currentOption.color, border: 'none',
          boxShadow: `0 8px 20px ${currentOption.color}40`
        }}
      >
        Xizmatni faollashtirish
      </Button>
      
      <Button 
        type="text" 
        block 
        onClick={onClose}
        style={{ marginTop: 8, color: '#94a3b8', fontSize: 12 }}
      >
        Rahmat, keyinroq
      </Button>
    </Modal>
  );
}