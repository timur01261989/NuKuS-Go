import React, { useMemo, useState } from "react";
import { useClientText } from "../../shared/i18n_clientLocalize";
import { Button, Card, Form, Input, Modal, List, Typography } from "antd";
import { ContactsOutlined } from "@ant-design/icons";
import { useContacts } from "../../hooks/useContacts";
const { Text } = Typography;

export default function ReceiverForm({ value, onChange }) {
  const v = value || {};
  const set = (patch) => onChange?.({ ...v, ...patch });

  const { supported, contacts, loadContacts } = useContacts();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const canOpen = useMemo(() => true, []);

  const openContacts = async () => {
    if (!canOpen) return;
    setOpen(true);
    setLoading(true);
    await loadContacts();
    setLoading(false);
  };

  return (
    <Card style={{ borderRadius: 18 }} bodyStyle={{ padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div style={{ fontWeight: 1000 }}>Qabul qiluvchi</div>
        <Button
          icon={<ContactsOutlined />}
          onClick={openContacts}
          style={{ borderRadius: 14 }}
        >
          Kontaktlar
        </Button>
      </div>

      <Form layout="vertical" style={{ marginTop: 10 }}>
        <Form.Item label="Ism" required>
          <Input value={v.name || ""} onChange={(e) => set({ name: e.target.value })} placeholder="Masalan: Aziz" />
        </Form.Item>

        <Form.Item label="Telefon" required>
          <Input value={v.phone || ""} onChange={(e) => set({ phone: e.target.value })} placeholder="+998..." />
        </Form.Item>

        <Text type="secondary" style={{ fontSize: 12 }}>
          {supported ? {cp("Kontaktlardan tanlash ishlashi mumkin.")} : {cp("Kontaktlar API yo‘q — demo ro‘yxat chiqadi.")}}
        </Text>
      </Form>

      <Modal
        title="Kontaktlar"
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
      >
        <List
          loading={loading}
          dataSource={contacts}
          renderItem={(c) => (
            <List.Item
              onClick={() => {
                set({ name: c.name || v.name, phone: c.phone });
                setOpen(false);
              }}
              style={{ cursor: "pointer" }}
            >
              <List.Item.Meta
                title={c.name}
                description={c.phone}
              />
            </List.Item>
          )}
        />
      </Modal>
    </Card>
  );
}