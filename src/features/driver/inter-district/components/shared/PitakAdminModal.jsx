import React, { useEffect, useMemo, useState } from "react";
import { Button, Col, Form, Input, Modal, Row, Select, Switch, Table, message } from "antd";
import { supabase } from "@/lib/supabase";
import { deletePitak, listPitaks, upsertPitak } from "@/features/shared/interDistrictTrips";
import { districtData } from "../../services/districtData";

export default function PitakAdminModal({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const regions = useMemo(() => {
    const list = districtData?.regions || districtData?.REGIONS || [];
    if (Array.isArray(list) && list.length) return list;
    const dmap = districtData?.districtsByRegion || {};
    return Object.keys(dmap);
  }, []);

  const region = Form.useWatch("region", form);

  const districts = useMemo(() => {
    const dmap = districtData?.districtsByRegion || {};
    if (!region) return [];
    return (dmap[region] || []).map((d) => ({ value: d, label: d }));
  }, [region]);

  const refresh = async (r) => {
    setLoading(true);
    try {
      const { data, error } = await listPitaks({ region: r, isActive: null });
      if (error) throw error;
      setRows(data || []);
    } catch (e) {
      message.error(e?.message || "Pitaklarni olishda xato");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const r0 = regions?.[0] || "";
    form.setFieldsValue({ region: r0, is_active: true });
    refresh(r0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (region) refresh(region);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region, open]);

  const save = async () => {
    const v = await form.validateFields();
    setLoading(true);
    try {
      // Optional admin check can be added later; for now any authenticated can manage.
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user?.id) throw new Error("Login bo‘ling");

      const payload = {
        id: editing?.id || undefined,
        region: v.region,
        district: v.district || null,
        name: v.name,
        note: v.note || null,
        is_active: !!v.is_active,
        point: v.lat != null && v.lng != null ? { lat: Number(v.lat), lng: Number(v.lng) } : null,
      };

      const { error } = await upsertPitak(payload);
      if (error) throw error;

      message.success("Saqlangan");
      setEditing(null);
      form.setFieldsValue({ name: "", district: null, lat: null, lng: null, note: "", is_active: true });
      await refresh(v.region);
    } catch (e) {
      message.error(e?.message || "Saqlashda xato");
    } finally {
      setLoading(false);
    }
  };

  const onEdit = (r) => {
    setEditing(r);
    form.setFieldsValue({
      region: r.region,
      district: r.district,
      name: r.name,
      lat: r.point?.lat ?? null,
      lng: r.point?.lng ?? null,
      note: r.note || "",
      is_active: r.is_active,
    });
  };

  const onDelete = async (r) => {
    setLoading(true);
    try {
      const { error } = await deletePitak(r.id);
      if (error) throw error;
      message.success("O‘chirildi");
      await refresh(region);
    } catch (e) {
      message.error(e?.message || "O‘chirishda xato");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: "Nomi", dataIndex: "name", key: "name" },
    { title: "Tuman", dataIndex: "district", key: "district", render: (v) => v || "—" },
    { title: "Aktiv", dataIndex: "is_active", key: "is_active", render: (v) => (v ? "Ha" : "Yo‘q") },
    { title: "Point", dataIndex: "point", key: "point", render: (p) => (p?.lat ? `${p.lat}, ${p.lng}` : "—") },
    {
      title: "Amal",
      key: "act",
      render: (_, r) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Button size="small" onClick={() => onEdit(r)}>Edit</Button>
          <Button size="small" danger onClick={() => onDelete(r)}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Pitaklar (Admin)"
      width={980}
      footer={[
        <Button key="close" onClick={onClose}>Yopish</Button>,
        <Button key="save" type="primary" loading={loading} onClick={save}>Saqlash</Button>,
      ]}
    >
      <Form form={form} layout="vertical" initialValues={{ is_active: true }}>
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item name="region" label="Hudud" rules={[{ required: true }]}>
              <Select options={(regions || []).map((r) => ({ value: r, label: r }))} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="district" label="Tuman (ixtiyoriy)">
              <Select allowClear options={districts} showSearch />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="name" label="Pitak nomi" rules={[{ required: true }]}>
              <Input placeholder="Masalan: Avtovokzal" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="lat" label="Lat">
              <Input placeholder="41.31" />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="lng" label="Lng">
              <Input placeholder="69.24" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="note" label="Izoh">
              <Input placeholder="Masalan: Kirish darvozasi oldi" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="is_active" label="Aktiv" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={rows}
        columns={columns}
        pagination={{ pageSize: 10 }}
      />
    </Modal>
  );
}
