import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

function normalizeProfile(row) {
  if (!row) return null;
  return {
    ...row,
    role: row.role || row.current_role || "client",
    current_role: row.current_role || row.role || "client",
    is_admin: row.is_admin === true || (row.role || row.current_role) === "admin",
  };
}

function normalizeApplication(row) {
  if (!row) return null;
  return {
    ...row,
    status: String(row.status || "pending").toLowerCase(),
  };
}

function normalizeDriver(row) {
  if (!row) return null;
  const verified = row.is_verified === true || row.approved === true;
  return {
    ...row,
    approved: verified,
    is_verified: verified,
    allowed_services: Array.isArray(row.allowed_services) ? row.allowed_services : [],
  };
}

export function useSessionProfile(options = {}) {
  const { includeDriver = true, includeApplication = true } = options;

  const mounted = useRef(true);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [driverRow, setDriverRow] = useState(null);
  const [application, setApplication] = useState(null);

  const fetchAll = useCallback(
    async (nextSession) => {
      if (mounted.current) setLoading(true);
      const uid = nextSession?.user?.id ?? null;

      if (!uid) {
        if (mounted.current) {
          setSession(nextSession ?? null);
          setProfile(null);
          setDriverRow(null);
          setApplication(null);
          setLoading(false);
        }
        return;
      }

      try {
        const profilePromise = supabase.from("profiles").select("*").eq("id", uid).maybeSingle();

        const driverPromise = includeDriver
          ? supabase.from("drivers").select("*").eq("user_id", uid).maybeSingle()
          : Promise.resolve({ data: null, error: null });

        const appPromise = includeApplication
          ? supabase
              .from("driver_applications")
              .select("*")
              .eq("user_id", uid)
              .order("submitted_at", { ascending: false })
              .limit(1)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null });

        const [profileRes, driverRes, appRes] = await Promise.all([
          profilePromise,
          driverPromise,
          appPromise,
        ]);

        if (profileRes.error) throw profileRes.error;
        if (driverRes.error) throw driverRes.error;
        if (appRes.error) throw appRes.error;

        if (mounted.current) {
          setSession(nextSession ?? null);
          setProfile(normalizeProfile(profileRes.data || null));
          setDriverRow(normalizeDriver(driverRes.data || null));
          setApplication(normalizeApplication(appRes.data || null));
          setLoading(false);
        }
      } catch (error) {
        console.error("useSessionProfile error:", error);
        if (mounted.current) {
          setSession(nextSession ?? null);
          setProfile(null);
          setDriverRow(null);
          setApplication(null);
          setLoading(false);
        }
      }
    },
    [includeApplication, includeDriver]
  );

  useEffect(() => {
    mounted.current = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("useSessionProfile getSession error:", error);
        fetchAll(null);
        return;
      }
      fetchAll(data?.session ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      fetchAll(nextSession ?? null);
    });

    return () => {
      mounted.current = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, [fetchAll]);

  const user = session?.user ?? null;
  const userId = user?.id ?? null;
  const role = profile?.role ?? "client";
  const isAdmin = !!profile?.is_admin;
  const driverExists = !!driverRow;
  const driverApproved = !!driverRow?.is_verified;
  const applicationStatus = application?.status ?? null;
  const transportType = driverRow?.transport_type || application?.transport_type || null;
  const allowedServices = driverRow?.allowed_services ?? [];

  return {
    loading,
    session,
    user,
    userId,
    profile,
    role,
    isAdmin,
    driverRow,
    driver: driverRow,
    driverExists,
    driverApproved,
    application,
    driverApp: application,
    applicationStatus,
    transportType,
    allowedServices,
    refetch: () => fetchAll(session),
  };
}

export default useSessionProfile;
