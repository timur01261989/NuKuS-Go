import React from "react";
import { List } from "antd";

/** Address list item */
export default function AddressItem({ title, description, onClick, icon }) {
  return (
    <List.Item className="yg-list-item" onClick={onClick}>
      <List.Item.Meta title={title} description={description} avatar={icon} />
    </List.Item>
  );
}
