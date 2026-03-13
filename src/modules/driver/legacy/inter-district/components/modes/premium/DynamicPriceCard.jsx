import React, { useMemo, useState } from 'react';
import { Card, Typography, Space, Switch, Button, Modal, Radio, Tag } from 'antd';
import { useDistrict } from '../../../context/DistrictContext';

const { Text, Title } = Typography;

export default function DynamicPriceCard() {
  const { pricing, seats, partialDeparture, setPartialDeparture } = useDistrict();
  const taken = Object.values(seats).filter((s) => s.taken).length;
  const maxSeats = 4;
  const empty = Math.max(0, maxSeats - taken);

  const [open, setOpen] = useState(false);

  const perClientShare = useMemo(() => {
    if (!partialDeparture?.enabled) return null;
    if (partialDeparture?.strategy !== 'split_to_clients') return null;
    if (taken <= 0) return null;
    const emptyCost = empty * (pricing.baseSeatPrice || 0);
    return Math.round(emptyCost / taken);
  }, [partialDeparture, taken, empty, pricing.baseSeatPrice]);

  return (
    <Card style={{ borderRadius: 16 }}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }} align="start">
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Premium narx
          </Text>
          <Title level={4} style={{ margin: 0 }}>
            {Math.round(pricing.total || 0).toLocaleString('uz-UZ')} so‘m
          </Title>
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            O‘rindiq: {pricing.baseSeatPrice.toLocaleString('uz-UZ')} + Pickup: {pricing.pickupFee.toLocaleString('uz-UZ')}
          </div>
          {perClientShare != null && (
            <Tag color="gold" style={{ marginTop: 8 }}>
              Bo‘sh joylar ulushi: +{perClientShare.toLocaleString('uz-UZ')} so‘m / har mijoz
            </Tag>
          )}
        </div>

        <div style={{ textAlign: 'right' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Bo‘sh joy: {empty}
          </Text>
          <div style={{ marginTop: 6 }}>
            <Switch
              checked={!!partialDeparture?.enabled}
              onChange={(v) => {
                setPartialDeparture({ enabled: v });
                if (v) setOpen(true);
              }}
            />
            <div style={{ fontSize: 12, opacity: 0.75 }}>Chala ketish</div>
          </div>
        </div>
      </Space>

      <Button
        style={{ marginTop: 12 }}
        block
        onClick={() => setOpen(true)}
        disabled={!partialDeparture?.enabled}
      >
        Bo‘sh joylar bilan ketish sozlamasi
      </Button>

      <Modal
        title="Chala ketish (Premium)"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => setOpen(false)}
        okText="Saqlash"
        cancelText="Yopish"
        centered
      >
        <Text type="secondary">
          Agar 4 ta odam yig‘ilmasa ham yo‘lga chiqmoqchisiz. Bo‘sh joy narxi qanday bo‘lsin?
        </Text>
        <div style={{ marginTop: 12 }}>
          <Radio.Group
            value={partialDeparture?.strategy}
            onChange={(e) => setPartialDeparture({ strategy: e.target.value })}
          >
            <Space direction="vertical">
              <Radio value="driver_cover">Haydovchi bo‘sh joy pulini o‘zi qoplaydi</Radio>
              <Radio value="split_to_clients">Bo‘sh joy pulini o‘tirgan mijozlarga bo‘lib qo‘shish</Radio>
            </Space>
          </Radio.Group>
        </div>
      </Modal>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
        Chala ketish: 2 kishi butun salonni “sotib olsa” — haydovchi kutmasdan ketishi mumkin.
      </div>
    </Card>
  );
}
