import React from "react";
import { Modal } from "antd";

export default function HeavyLoadAlert({ open, onClose, tons }) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={onClose}
      okText="Tushunarli"
      cancelButtonProps={{ style: { display: "none" } }}
      title="Diqqat!"
      centered
    >
      <div style={{ fontSize: 14 }}>
        Yuk og‘irligi <b>{tons}</b> tonna. 10 tonnadan og‘ir bo‘lsa, tarozi va ruxsatnomalar talab qilinishi mumkin.
      </div>
    </Modal>
  );
}
