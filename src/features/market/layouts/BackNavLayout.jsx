
import React from "react";
import { Layout } from "antd";
import MarketHeader from "../components/Common/MarketHeader";

const { Content } = Layout;

export default function BackNavLayout({ title, right, children }) {
  return (
    <Layout style={{ minHeight: "100vh", background: "#fafafa" }}>
      <MarketHeader title={title} showBack right={right} />
      <Content>{children}</Content>
    </Layout>
  );
}
