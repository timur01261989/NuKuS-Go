import React from "react";
import {
  HomeOutlined, HistoryOutlined, SettingOutlined, LogoutOutlined, CarOutlined, ContainerOutlined,
  RocketOutlined, GlobalOutlined, UserAddOutlined, CustomerServiceOutlined, EnvironmentOutlined,
  FireOutlined, ShopOutlined
} from "@ant-design/icons";

import taxiImg from "/assets/taxi.jpg";
import cityImg from "/assets/city.jpg";
import villageImg from "/assets/village.jpg";
import truckImg from "/assets/truck.jpg";
import deliveryImg from "/assets/delivery.jpg";

export function applyNightModeClass(enabled) {
  if (enabled) document.body.classList.add("night-mode-active");
  else document.body.classList.remove("night-mode-active");
}

export function buildMenuItems(t, logout) {
  return [
    { key: "dashboard", icon: <HomeOutlined />, label: t.dashboard },
    { key: "orders", icon: <HistoryOutlined />, label: t.ordersHistory },
    { key: "settings", icon: <SettingOutlined />, label: t.settings },
    { key: "support", icon: <CustomerServiceOutlined />, label: t.support },
    { key: "logout", icon: <LogoutOutlined />, label: t.logout, danger: true, onClick: logout },
  ];
}

export function buildLangMenu(tx, changeLang) {
  return {
    items: [
      { key: "uz_lotin", label: tx("currentLangUzLatin", "O‘zbek (lotin)"), onClick: () => changeLang("uz_lotin") },
      { key: "uz_kirill", label: tx("currentLangUzCyrillic", "O‘zbek (kirill)"), onClick: () => changeLang("uz_kirill") },
      { key: "qq_latin", label: tx("currentLangQqLatin", "Qoraqalpoq (lotin)"), onClick: () => changeLang("qq_latin") },
      { key: "qq_kirill", label: tx("currentLangQqCyrillic", "Qoraqalpoq (kirill)"), onClick: () => changeLang("qq_kirill") },
      { key: "ru", label: tx("currentLangRu", "Русский"), onClick: () => changeLang("ru") },
      { key: "en", label: tx("currentLangEn", "English"), onClick: () => changeLang("en") },
    ],
  };
}

export function buildServices(t) {
  return [
    {
      key: "taxi",
      title: t.taxi,
      desc: t.taxiDesc,
      icon: <CarOutlined style={{ fontSize: 28 }} />,
      img: taxiImg,
      view: "taxi",
      color: "#FFD700",
    },
    {
      key: "interProv",
      title: t.interProvincial,
      desc: t.interProvincialDesc,
      icon: <GlobalOutlined style={{ fontSize: 28 }} />,
      img: cityImg,
      view: "interProvincial",
      color: "#4CAF50",
    },
    {
      key: "interDist",
      title: t.interDistrict,
      desc: t.interDistrictDesc,
      icon: <EnvironmentOutlined style={{ fontSize: 28 }} />,
      img: villageImg,
      view: "interDistrict",
      color: "#2196F3",
    },
    {
      key: "freight",
      title: t.freight,
      desc: t.freightDesc,
      icon: <ContainerOutlined style={{ fontSize: 28 }} />,
      img: truckImg,
      view: "freight",
      color: "#FF5722",
    },
    {
      key: "delivery",
      title: t.delivery,
      desc: t.deliveryDesc,
      icon: <RocketOutlined style={{ fontSize: 28 }} />,
      img: deliveryImg,
      view: "delivery",
      color: "#9C27B0",
    },
    {
      key: "driver",
      title: t.driver,
      desc: t.driverDesc,
      icon: <UserAddOutlined style={{ fontSize: 28 }} />,
      img: taxiImg,
      view: "driver",
      color: "#111827",
    },
    {
      key: "market",
      title: t.autoMarket || "Avto Bozor",
      desc: t.autoMarketDesc || "Mashina e'lonlari va savdo",
      icon: <ShopOutlined style={{ fontSize: 28 }} />,
      img: truckImg,
      view: "market",
      color: "#ef4444",
    },
    {
      key: "promos",
      title: t.promos || "Aksiyalar",
      desc: t.promosDesc || "Chegirmalar va bonuslar",
      icon: <FireOutlined style={{ fontSize: 28 }} />,
      img: cityImg,
      view: "promos",
      color: "#f97316",
    },
  ];
}
