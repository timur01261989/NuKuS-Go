
import React from "react";
import { Button } from "antd";
import { FilterOutlined } from "@ant-design/icons";

export default function FilterButton({ onClick }) {
  return (
    <Button icon={<FilterOutlined />} onClick={onClick} style={{ borderRadius: 12 }}>
      Filtr
    </Button>
  );
}
