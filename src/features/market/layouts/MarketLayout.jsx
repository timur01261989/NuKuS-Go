
import React from "react";
import { Layout } from "antd";
import MarketTabBar from "../components/Common/MarketTabBar";

const { Content } = Layout;

export default function MarketLayout({ children }) {
  return (
    <Layout style={{ minHeight: "100vh", background: "#fafafa" }}>
      <Content style={{ paddingBottom: 74 }}>{children}</Content>
      <MarketTabBar />
    </Layout>
  );
}
