import React, { useEffect, useMemo, useState } from "react";
import { Button, Drawer, Form, Input, InputNumber, Switch, message } from "antd";
import { supabase } from "@/lib/supabase";
import { requestTrip } from "@/features/shared/interDistrictTrips";

export default function RequestTripDrawer({ open, onClose, trip, defaultPickup, defaultDropoff }) {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      client_name: "",
      client_phone: "",
      seats: 1,
      wants_full_salon: false,
      pickup_address: defaultPickup || "",
      dropoff_address: defaultDropoff || "",
      note: "",
    });
  }, [open, defaultPickup, defaultDropoff, form]);

  const onSubmit = async () => {
    const v = await form.validateFields();
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id || null;

      if (!trip?.id) throw new Error("Trip topilmadi");
      if (!v.client_phone) throw new Error("Telefon kiriting");

      // Basic seats validation
      if (v.wants_full_salon) {
        if (!trip?.allow_full_salon) throw new Error("Bu reysda polni salon yo‘q");
      } else {
        const seats = Number(v.seats || 1);
        if (seats < 1) throw new Error("O‘rindiq soni noto‘g‘ri");
        if (trip?.seats_available != null && seats > Number(trip.seats_available)) {
          throw new Error("Bo‘sh joy yetarli emas");
        }
      }

      const { error } = await requestTrip({
        trip_id: trip.id,
        client_id: uid,
        client_name: v.client_name || null,
        client_phone: v.client_phone,
        seats: Number(v.seats || 1),
        wants_full_salon: !!v.wants_full_salon,
        pickup_address: v.pickup_address || null,
        dropoff_address: v.dropoff_address || null,
        note: v.note || null,
      });
      if (error) throw error;

      message.success("So‘rov yuborildi");
      onClose?.();
    } catch (e) {
      message.error(e?.message || "Xato");
    } finally {
      setLoading(false);
    }
  };

  const title = useMemo(() => {
    if (!trip) return "So‘rov";
    return `So‘rov: ${trip.from_district} → ${trip.to_district}`;
  }, [trip]);

  return (
    <Drawer open={open} onClose={onClose} title={title} width={520}>
      <Form layout="vertical" form={form}>
        <Form.Item name="client_name" label="Ism (ixtiyoriy)">
          <Input />
        </Form.Item>
        <Form.Item name="client_phone" label="Telefon" rules={[{ required: true }]}>
          <Input placeholder="+998..." />
        </Form.Item>

        <Form.Item name="wants_full_salon" label="Polni salon" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item shouldUpdate noStyle>
          {({ getFieldValue }) =>
            getFieldValue("wants_full_salon") ? null : (
              <Form.Item name="seats" label="O‘rindiqlar soni" rules={[{ required: true }]}>
                <InputNumber min={1} max={12} style={{ width: "100%" }} />
              </Form.Item>
            )
          }
        </Form.Item>

        <Form.Item name="pickup_address" label="Uyidan olib ketish manzili (ixtiyoriy)">
          <Input placeholder="Majburiy emas" />
        </Form.Item>

        <Form.Item name="dropoff_address" label="Uyiga olib borish manzili (ixtiyoriy)">
          <Input placeholder="Majburiy emas" />
        </Form.Item>

        <Form.Item name="note" label="Izoh (ixtiyoriy)">
          <Input.TextArea rows={3} />
        </Form.Item>

        <Button type="primary" loading={loading} onClick={onSubmit} block>
          Yuborish
        </Button>
      </Form>
    </Drawer>
  );
}
