
import React from "react";
import { Empty } from "antd";

export default function EmptyState({ title = "Hech narsa topilmadi", description }) {
  return (
    <div style={{ padding: 24 }}>
      <Empty description={description || title} />
    </div>
  );
}
