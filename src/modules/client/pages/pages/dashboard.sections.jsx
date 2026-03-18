import React from "react";
import { Avatar, Button, Drawer, Dropdown, List, Space, Typography } from "antd";
import { GlobalOutlined, MenuOutlined } from "@ant-design/icons";
import { profileAssets } from "@/assets/profile";
import { assetStyles } from "@/assets/assetPolish";

const { Title, Text } = Typography;

export function DashboardHeader({ appName, langMenu, onMenuClick }) {
  return (
    <div
      style={{
        height: 60,
        background: "#fff",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        borderBottom: "1px solid #eee",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <Button type="text" icon={<MenuOutlined />} onClick={onMenuClick} style={{ marginRight: 10 }} />
      <Title level={5} style={{ margin: 0, flex: 1 }}>{appName}</Title>
      <Dropdown menu={langMenu} placement="bottomRight" trigger={["click"]}>
        <Button type="text" icon={<GlobalOutlined />} />
      </Dropdown>
    </div>
  );
}

export function DashboardDrawer({ title, subtitle, open, onClose, menuItems, onSelect }) {
  return (
    <Drawer
      title={
        <Space>
          <Avatar src={profileAssets.avatar} style={assetStyles.profileAvatar} />
          <div>
            <div style={{ fontWeight: 700 }}>{title}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>{subtitle}</Text>
          </div>
        </Space>
      }
      placement="left"
      onClose={onClose}
      open={open}
      bodyStyle={{ padding: 0 }}
    >
      <List
        dataSource={menuItems}
        renderItem={(item) => (
          <List.Item
            style={{
              cursor: "pointer",
              padding: "12px 16px",
              color: item.danger ? "#ff4d4f" : "inherit",
            }}
            onClick={() => onSelect(item)}
          >
            <Space>
              {item.icon}
              <span>{item.label}</span>
            </Space>
          </List.Item>
        )}
      />
    </Drawer>
  );
}
