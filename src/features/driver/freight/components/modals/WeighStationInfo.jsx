import React from "react";
import { Modal, List } from "antd";

export default function WeighStationInfo({ open, onClose }) {
  const stations = [
    { name: "Nukus Tarozi (demo)", note: "Katta yuklar uchun" },
    { name: "Qo'ng'irot yo'li (demo)", note: "Tavsiyaviy tekshiruv" },
  ];

  return (
    <Modal open={open} onCancel={onClose} footer={null} title="Tarozi (Info)" centered>
      <List
        dataSource={stations}
        renderItem={(s) => (
          <List.Item>
            <List.Item.Meta title={s.name} description={s.note} />
          </List.Item>
        )}
      />
    </Modal>
  );
}
