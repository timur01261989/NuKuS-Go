import React from "react";
import { useNavigate } from "react-router-dom";
import DriverWallet from "../components/DriverWallet";

export default function DriverWalletPage() {
  const navigate = useNavigate();
  return <DriverWallet onBack={() => navigate(-1)} />;
}
