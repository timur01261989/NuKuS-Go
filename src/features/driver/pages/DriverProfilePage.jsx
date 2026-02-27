import React from "react";
import { useNavigate } from "react-router-dom";
import DriverProfile from "../components/DriverProfile";
import { supabase } from "@/lib/supabase";

export default function DriverProfilePage() {
  const navigate = useNavigate();

  const onLogout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return <DriverProfile onBack={() => navigate(-1)} onLogout={onLogout} />;
}
