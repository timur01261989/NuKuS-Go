import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Avatar, Typography, Row, Col, Statistic, Button, List, Rate, Tag, message } from "antd";
import {
  UserOutlined,
  CarOutlined,
  StarFilled,
  WalletOutlined,
  HistoryOutlined,
  SettingOutlined,
  LogoutOutlined,
  CameraOutlined,
  ArrowLeftOutlined,
  TrophyFilled,
} from "@ant-design/icons";
import { supabase } from "@/lib/supabase";
import { fetchDriverCore } from "@/shared/auth/driverCoreAccess";
import DriverWallet from "./DriverWallet";
import ActivityChart from "./ActivityChart";
import Leaderboard from "./Leaderboard";
import { useDriverText } from "../shared/i18n_driverLocalize";

const { Title, Text } = Typography;

function DriverProfile({ onBack, onLogout }) {
  const { cp } = useDriverText();
  const navigate = useNavigate();
  const [driverData, setDriverData] = useState(null);
  const [stats, setStats] = useState({ total_trips: 0, rating: 5.0 });
  const [walletOpen, setWalletOpen] = useState(false);
  const [userId, setUserId] = useState(null);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchProfileData = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user?.id) {
        setUserId(null);
        setDriverData(null);
        setStats({ total_trips: 0, rating: 5.0 });
        return;
      }

      setUserId(user.id);

      const [core, { count, error: tripError }] = await Promise.all([
        fetchDriverCore(user.id),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("assigned_driver_user_id", user.id)
          .eq("status", "completed"),
      ]);

      if (tripError) throw tripError;

      const fullName = core?.profile?.full_name || [core?.application?.first_name, core?.application?.last_name].filter(Boolean).join(" ");
      const vehicleName = [core?.activeVehicle?.brand, core?.activeVehicle?.model].filter(Boolean).join(" ");
      const driver = {
        first_name: fullName,
        car_model: vehicleName,
        car_color: core?.activeVehicle?.color || "",
        plate_number: core?.activeVehicle?.plate_number || "",
        avatar_url: core?.profile?.avatar_url || "",
        average_rating: 5,
        rating_count: 0,
      };

      setDriverData(driver);
      setStats({
        total_trips: Number(count || 0),
        rating: Number(driver.average_rating || 5),
        rating_count: Number(driver.rating_count || 0),
      });
    } catch (error) {
      console.error("DriverProfile fetchProfileData error:", error);
      message.error(error?.message || "Driver profile yuklanmadi");
      setDriverData(null);
      setStats({ total_trips: 0, rating: 5.0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleOpenWallet = useCallback(() => setWalletOpen(true), []);
  const handleCloseWallet = useCallback(() => setWalletOpen(false), []);
  const handleOpenLeaderboard = useCallback(() => setLeaderboardOpen(true), []);
  const handleCloseLeaderboard = useCallback(() => setLeaderboardOpen(false), []);

  const profileName = useMemo(() => driverData?.first_name || cp("Haydovchi"), [driverData?.first_name]);
  const profileRatingCount = useMemo(() => driverData?.rating_count || 0, [driverData?.rating_count]);
  const cardStyle = useMemo(
    () => ({
      borderRadius: 20,
      border: "none",
      boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
    }),
    []
  );

  if (walletOpen) {
    return <DriverWallet onBack={handleCloseWallet} />;
  }

  if (leaderboardOpen) {
    return <Leaderboard onBack={handleCloseLeaderboard} />;
  }

  return (
    <div style={{ padding: "20px", background: "#f8f9fa", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack} shape="circle" style={{ border: "none" }} />
        <Title level={4} style={{ margin: 0, fontFamily: "YangoHeadline" }}>
          {cp("Profil")}
        </Title>
        <Button icon={<SettingOutlined />} shape="circle" onClick={() => navigate("/driver/settings?tab=services")} />
      </div>

      <Card
        loading={loading}
        style={{
          ...cardStyle,
          textAlign: "center",
          marginBottom: 20,
          borderRadius: 24,
        }}
      >
        <div style={{ position: "relative", display: "inline-block" }}>
          <Avatar size={100} src={driverData?.avatar_url || undefined} icon={<UserOutlined />} style={{ border: "4px solid #FFD700" }} />
          <Button
            shape="circle"
            size="small"
            icon={<CameraOutlined />}
            style={{ position: "absolute", bottom: 5, right: 5, background: "#FFD700", border: "none" }}
          />
        </div>
        <Title level={3} style={{ marginTop: 15, marginBottom: 5 }}>
          {profileName}
        </Title>
        <Rate disabled value={stats.rating} allowHalf style={{ color: "#FFD700", fontSize: 14 }} />
        <Text type="secondary" style={{ display: "block" }}>
          ({profileRatingCount} {cp("ta baho")})
        </Text>
      </Card>

      <Row gutter={15} style={{ marginBottom: 20 }}>
        <Col span={12}>
          <Card style={{ ...cardStyle, textAlign: "center" }}>
            <Statistic title={cp("Jami safarlar")} value={stats.total_trips} prefix={<HistoryOutlined />} />
          </Card>
        </Col>
        <Col span={12}>
          <Card style={{ ...cardStyle, textAlign: "center" }}>
            <Statistic title={cp("Reyting")} value={stats.rating} precision={1} prefix={<StarFilled style={{ color: "#FFD700" }} />} />
          </Card>
        </Col>
      </Row>

      {userId ? <ActivityChart driverId={userId} /> : null}

      <div style={{ marginBottom: 20 }} />

      <Card title={<><CarOutlined /> {cp("Mashina ma'lumotlari")}</>} style={{ ...cardStyle, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <Text type="secondary">{cp("Model:")}</Text>
          <Text strong>{driverData?.car_model || "---"}</Text>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <Text type="secondary">{cp("Rangi:")}</Text>
          <Text strong>{driverData?.car_color || "---"}</Text>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Text type="secondary">{cp("Davlat raqami:")}</Text>
          <Tag color="black" style={{ fontSize: 14, fontWeight: "bold" }}>
            {driverData?.plate_number || "---"}
          </Tag>
        </div>
      </Card>

      <Card style={{ ...cardStyle, marginBottom: 20 }}>
        <List itemLayout="horizontal">
          <List.Item onClick={handleOpenLeaderboard} style={{ cursor: "pointer" }}>
            <List.Item.Meta
              avatar={<TrophyFilled style={{ color: "#FFD700", fontSize: 22 }} />}
              title={<b>{cp("Top haydovchilar")}</b>}
              description={cp("Nukus Go reytingida o'z o'rningizni ko'ring")}
            />
          </List.Item>

          <List.Item onClick={handleOpenWallet} style={{ cursor: "pointer" }}>
            <List.Item.Meta
              avatar={<WalletOutlined style={{ color: "#FFD700", fontSize: 20 }} />}
              title={<b>{cp("Hamyon va balans")}</b>}
              description={cp("Daromadlarni ko'rish va pul yechish")}
            />
          </List.Item>

          <List.Item style={{ cursor: "pointer" }} onClick={onLogout}>
            <List.Item.Meta
              avatar={<LogoutOutlined style={{ color: "red" }} />}
              title={<Text type="danger">{cp("Tizimdan chiqish")}</Text>}
            />
          </List.Item>
        </List>
      </Card>
    </div>
  );
}

export default memo(DriverProfile);
