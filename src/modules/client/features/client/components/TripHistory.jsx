import React, { useState, useEffect } from "react";
import { List, Card, Typography, Tag, Button, Skeleton, Empty, Space } from "antd";
import { ArrowLeftOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase/supabaseClient";
import { useLanguage } from "@/modules/shared/i18n/useLanguage";
import { supportAssets } from "@/assets/support";
import { orderAssets } from "@/assets/order";
import { safeBack } from "@/modules/shared/navigation/safeBack";
import { assetSizes, assetStyles } from "@/assets/assetPolish";

const { Text, Title } = Typography;

function resolveServiceIcon(trip) {
  const type = String(trip?.service_type || trip?.service || trip?.category || "").toLowerCase();
  if (type.includes("truck") || type.includes("freight")) return orderAssets.courier.orderTruck;
  if (type.includes("wash")) return orderAssets.history.orderWash;
  if (type.includes("station") || type.includes("fuel")) return orderAssets.history.orderStation;
  if (type.includes("delivery") || type.includes("courier")) return orderAssets.courier.orderDeliveryCar || orderAssets.courier.orderDelivery;
  return orderAssets.history.orderReceiptAlt || supportAssets.history.receiptOrder || supportAssets.history.receipt;
}

function resolveStatusIcon(status) {
  const value = String(status || "").toLowerCase();
  if (value.includes("cancel")) return orderAssets.history.orderCross;
  if (value.includes("schedule") || value.includes("pending")) return orderAssets.history.orderSchedule;
  if (value.includes("warn")) return orderAssets.history.orderWarning;
  return orderAssets.history.orderCheck;
}

export default function TripHistory() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false });
      if (data) setTrips(data);
    }
    setLoading(false);
  };

  const goBack = () => navigate(-1);

  return (
    <div style={{ padding: "20px", background: "#f8f9fa", minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 25 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={goBack} shape="circle" />
        <div className="flex items-center gap-2">
          <img src={orderAssets.history.orderReceipt} alt="" className={assetSizes.walletHistoryIcon} />
          <Title level={4} style={{ margin: "0 0 0 15px", fontFamily: "AccentHeadline" }}>
            {t.orderHistoryTitle}
          </Title>
        </div>
      </div>
      {loading ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : trips.length === 0 ? (
        <Empty description={t.noTripsYet} style={{ marginTop: 100 }} />
      ) : (
        <List
          dataSource={trips}
          renderItem={(trip) => {
            const tripStatus = trip.status || "completed";
            return (
              <Card
                style={{ borderRadius: 20, marginBottom: 15, border: "none", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}
                styles={{ body: { padding: "15px" } }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, gap: 8, flexWrap: "wrap" }}>
                  <Tag color="default" icon={<ClockCircleOutlined />}>
                    {new Date(trip.created_at).toLocaleDateString()}
                  </Tag>
                  <Text strong style={{ color: "#1890ff" }}>
                    {parseInt(trip.price_uzs || trip.price || 0, 10).toLocaleString()} {t.som}
                  </Text>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
                  <Space size={8}>
                    <img src={resolveServiceIcon(trip)} alt="" style={assetStyles.orderServiceIcon} />
                    <Text>{trip.service_type || trip.service || t.orderLabel}</Text>
                  </Space>
                  <Tag
                    color={tripStatus === "completed" ? "success" : "default"}
                    icon={<img src={resolveStatusIcon(tripStatus)} alt="" style={{ width: 14, height: 14, objectFit: "contain" }} />}
                    style={{ borderRadius: 999, paddingInline: 10 }}
                  >
                    {tripStatus}
                  </Tag>
                </div>

                <div style={{ position: "relative", paddingLeft: "20px" }}>
                  <div style={{ position: "absolute", left: 4, top: 6, bottom: 6, width: 2, background: "#ddd" }} />
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ width: 8, height: 8, background: "#52c41a", borderRadius: "50%", position: "absolute", left: 1, top: 6 }} />
                    <Text type="secondary" style={{ fontSize: 12, display: "block" }}>{t.fromLabel}:</Text>
                    <Text strong>{trip.pickup?.address?.split(",").slice(0, 2).join(",") || trip.pickup_location?.split(",").slice(0, 2).join(",")}</Text>
                  </div>
                  <div>
                    <div style={{ width: 8, height: 8, background: "#ff4d4f", borderRadius: 2, position: "absolute", left: 1, bottom: 12 }} />
                    <Text type="secondary" style={{ fontSize: 12, display: "block" }}>{t.toLabel}:</Text>
                    <Text strong>{trip.dropoff?.address?.split(",").slice(0, 2).join(",") || trip.dropoff_location?.split(",").slice(0, 2).join(",") || t.locateOnMap}</Text>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 15,
                    paddingTop: 12,
                    borderTop: "1px solid #f0f0f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <Space size={6}>
                      <img src={orderAssets.history.orderReceiptFill || orderAssets.history.orderReceipt} alt="" style={{ width: 16, height: 16, objectFit: "contain" }} />
                      <Text type="secondary" style={{ fontSize: 13 }}>Chek tayyor</Text>
                    </Space>
                    <Space size={6}>
                      <img src={orderAssets.history.orderSchedule} alt="" style={{ width: 16, height: 16, objectFit: "contain" }} />
                      <Text type="secondary" style={{ fontSize: 13 }}>{t.taxiService}</Text>
                    </Space>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Button type="text" icon={<img src={orderAssets.history.orderShare} alt="" className={assetSizes.walletHistoryIcon} />} />
                    <Button
                      type="default"
                      icon={<img src={orderAssets.history.orderSupportAlt || orderAssets.history.orderSupport} alt="" className={assetSizes.walletHistoryIcon} />}
                      style={{ borderRadius: 12 }}
                      onClick={() => { window.location.href = `/client/support/${trip.id}`; }}
                    >
                      {t.help}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          }}
        />
      )}
    </div>
  );
}
