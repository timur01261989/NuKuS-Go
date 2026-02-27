import React, { useMemo, useState } from "react";
import { Button, Card, Form, Input, Typography } from "antd";

const { Title, Text } = Typography;
const KEY = "savedAddresses_v1";

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function save(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export default function MyAddresses() {
  const [items, setItems] = useState(() => load());
  const [form] = Form.useForm();

  const add = (v) => {
    const next = [{ id: Date.now(), label: v.label, address: v.address }, ...items];
    setItems(next);
    save(next);
    form.resetFields();
  };

  const remove = (id) => {
    const next = items.filter(x => x.id !== id);
    setItems(next);
    save(next);
  };

  return (
    <div style={{ padding: 14, maxWidth: 860, margin: "0 auto" }}>
      <Title level={3} style={{ marginTop: 6 }}>Mening manzillarim</Title>

      <Card style={{ borderRadius: 16 }}>
        <Form form={form} layout="vertical" onFinish={add}>
          <Form.Item name="label" label="Nomi" rules={[{ required: true, message: "Nomi kerak" }]}>
            <Input placeholder="Uy / Ish / ..." />
          </Form.Item>
          <Form.Item name="address" label="Manzil" rules={[{ required: true, message: "Manzil kerak" }]}>
            <Input placeholder="Manzilni yozing" />
          </Form.Item>
          <Button type="primary" htmlType="submit" style={{ background: "#000", borderColor: "#000" }}>
            Saqlash
          </Button>
        </Form>
      </Card>

      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
        {items.map((a) => (
          <Card key={a.id} style={{ borderRadius: 16 }}>
            <Text strong>{a.label}</Text><br/>
            <Text type="secondary">{a.address}</Text>
            <div style={{ marginTop: 10 }}>
              <Button danger onClick={() => remove(a.id)}>O‘chirish</Button>
            </div>
          </Card>
        ))}
        {!items.length ? <Text type="secondary">Hozircha manzillar yo‘q.</Text> : null}
      </div>
    </div>
  );
}
