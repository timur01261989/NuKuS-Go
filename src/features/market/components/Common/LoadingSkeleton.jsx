
import React from "react";
import { Skeleton } from "antd";

export default function LoadingSkeleton({ rows = 6 }) {
  return (
    <div style={{ padding: 12 }}>
      <Skeleton active paragraph={{ rows }} />
    </div>
  );
}
