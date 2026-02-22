import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function Logout() {
  const navigate = useNavigate();
  useEffect(() => {
    (async () => {
      try { await supabase.auth.signOut(); } finally { navigate("/login", { replace: true }); }
    })();
  }, [navigate]);
  return null;
}
