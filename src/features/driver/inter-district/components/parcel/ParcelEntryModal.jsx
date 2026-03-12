import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, Upload, Button, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';

export default function ParcelEntryModal({ open, onClose, deliveryEnabled = true, freightEnabled = true, activeVehicle = null }) {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);

  const handleOk = async () => {
    if (!deliveryEnabled && !freightEnabled) {
      message.error("Bu xizmat aktiv emas. Avval Sozlamalarda eltish yoki yuk tashishni yoqing.");
      return;
    }
    const values = await form.validateFields();
    // Bu yerda serverga yuborish logikasini qo'shasiz.
    console.log('Parcel:', { ...values, files: fileList });
    message.success('Posilka qo‘shildi (demo)');
    form.resetFields();
    setFileList([]);
    onClose?.();
  };

  return (
    <Modal
      title="Posilka / Yuk qo‘shish"
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="Saqlash"
      cancelText="Bekor"
      centered
    >
      <Form form={form} layout="vertical">
        <Form.Item name="receiverPhone" label="Qabul qiluvchi tel" rules={[{ required: true, message: 'Telefon kiriting' }]}>
          <Input placeholder="+998 90 123 45 67" />
        </Form.Item>
        <div style={{ marginBottom: 12, fontSize: 12, opacity: 0.75 }}>Aktiv mashina: {Number(activeVehicle?.maxWeightKg || 0)}kg • {Number(activeVehicle?.maxVolumeM3 || 0)}m³</div>
        <Form.Item name="note" label="Izoh">
          <Input.TextArea rows={3} placeholder="Masalan: Televizor, sinuvchan" />
        </Form.Item>
        <Form.Item name="price" label="Posilka narxi (so‘m)">
          <InputNumber min={0} step={1000} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="Rasm (ixtiyoriy)">
          <Upload.Dragger
            multiple={false}
            fileList={fileList}
            beforeUpload={() => false}
            onChange={({ fileList: fl }) => setFileList(fl.slice(-1))}
            accept="image/*"
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Rasmni tashlang yoki bosing</p>
            <p className="ant-upload-hint">Kuryer/yo‘lovchi adashmasligi uchun.</p>
          </Upload.Dragger>
        </Form.Item>

        <Button onClick={() => message.info('SMS yuborish backend orqali qo‘shiladi')} block>
          SMS test (keyin)
        </Button>
      </Form>
    </Modal>
  );
}
