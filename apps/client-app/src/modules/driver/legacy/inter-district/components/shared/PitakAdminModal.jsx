import React, { useEffect, useMemo, useState } from "react";
import { Modal, Form, Select, Input, Button, List, Space, Typography, Switch, message } from "antd";
import { REGIONS, getDistrictsByRegion } from "@/modules/client/features/client/interDistrict/services/districtData.js";
import { listPitaks, upsertPitak, deletePitak } from "@/modules/client/features/shared/interDistrictTrips.js";

/**
 * PitakAdminModal.jsx
 * -------------------------------------------------------
 * Admin (yoki driver) pitaklarni DB ga kiritadi.
 * Real admin panel keyin alohida bo‘ladi, hozir esa minimal UI.
 */
export default function PitakAdminModal({ open, onClose }) {
  const [form] = Form.useForm();
  const regionId = Form.useWatch("region", form);
  const districts = useMemo(() => getDistrictsByRegion(regionId || "karakalpakstan"), [regionId]);
  const districtOptions = useMemo(() => districts.map((d) => ({ value: d.name, label: d.name })), [districts]);

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  const reload = async () => {
    const v = form.getFieldsValue();
    setLoading(true);
    try {
      const list = await listPitaks({
        region: v.region,
        from_district: v.from_district,
        to_district: v.to_district,
        activeOnly: false,
      });
      setItems(list || []);
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({ region: "karakalpakstan" });
    reload();
  }, [open]);

  const save = async () => {
    try {
      const v = await form.validateFields();
      await upsertPitak({
        region: v.region,
        from_district: v.from_district,
        to_district: v.to_district,
        title: v.title,
        is_active: v.is_active ?? true,
      });
      message.success("Pitak saqlandi");
      form.setFieldsValue({ title: "" });
      reload();
    } catch (e) {
      if (e?.errorFields) return;
      message.error(e?.message || "Xatolik");
    }
  };

  const remove = async (id) => {
    try {
      await deletePitak(id);
      message.success("O‘chirildi");
      reload();
    } catch (e) {
      message.error(e?.message || "Xatolik");
    }
  };

  return (
    <Modal title="Pitaklar (admin jadval)" open={open} onCancel={onClose} footer={null} width={560}>
      <Form layout="vertical" form={form}>
        <Form.Item name="region" label="Hudud" rules={[{ required: true }]}>
          <Select options={REGIONS.map((r) => ({ value: r.id, label: r.name }))} onChange={() => form.setFieldsValue({ from_district: null, to_district: null })} />
        </Form.Item>

        <Space style={{ width: "100%" }} size={10}>
          <Form.Item name="from_district" label="Qaerdan (tuman)" rules={[{ required: true }]} style={{ flex: 1 }}>
            <Select options={districtOptions} placeholder="Tanlang" onChange={reload} />
          </Form.Item>
          <Form.Item name="to_district" label="Qaerga (tuman)" rules={[{ required: true }]} style={{ flex: 1 }}>
            <Select options={districtOptions} placeholder="Tanlang" onChange={reload} />
          </Form.Item>
        </Space>

        <Form.Item name="title" label="Pitak nomi" rules={[{ required: true, message: "Pitak nomini yozing" }]}>
          <Input placeholder="Masalan: Avtovokzal, Koteks bozor, ..." />
        </Form.Item>

        <Form.Item name="is_active" valuePropName="checked" initialValue={true}>
          <Switch /> <span style={{ marginLeft: 8 }}>Aktiv</span>
        </Form.Item>

        <Button type="primary" onClick={save} style={{ width: "100%", borderRadius: 14, height: 42 }}>
          Pitak qo‘shish
        </Button>

        <Typography.Title level={5} style={{ margin: "14px 0 8px" }}>
          Mavjud pitaklar
        </Typography.Title>

        <List
          loading={loading}
          dataSource={items}
          renderItem={(p) => (
            <List.Item
              actions={[
                <Button danger onClick={() => remove(p.id)} key="del">
                  O‘chirish
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={<b>{p.title}</b>}
                description={`${p.region} · ${p.from_district} → ${p.to_district} · ${p.is_active ? "aktiv" : "off"}`}
              />
            </List.Item>
          )}
        />
      </Form>
    </Modal>
  );
}
