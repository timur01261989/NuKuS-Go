
import React from "react";
import { Skeleton } from "antd";

export default function SkeletonCard() {
  return (
    <div style={{ background: "white", border: "1px solid #f0f0f0", borderRadius: 16, padding: 12 }}>
      <Skeleton.Image active style={{ width: "100%", height: 140 }} />
      <div style={{ marginTop: 10 }}>
        <Skeleton active paragraph={{ rows: 2 }} title={false} />
      </div>
    </div>
  );
}
