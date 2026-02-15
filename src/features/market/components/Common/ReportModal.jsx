
import React from "react";
import { Modal, Input, message } from "antd";

export default function ReportModal({ open, onClose, adId }) {
  const [text, setText] = React.useState("");
  return (
    <Modal
      title="Shikoyat"
      open={open}
      onCancel={onClose}
      onOk={() => { message.success("Shikoyat yuborildi (demo)"); onClose?.(); setText(""); }}
      okText="Yuborish"
      cancelText="Bekor"
    >
      <div style={{ color: "#777", marginBottom: 8 }}>E'lon ID: {adId}</div>
      <Input.TextArea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="Muammo nimada?" />
    </Modal>
  );
}
