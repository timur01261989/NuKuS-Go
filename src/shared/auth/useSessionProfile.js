import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthOptional } from "./AuthProvider";

/**
 * useSessionProfile
 *
 * Single source for:
 * - auth session/user
 * - profiles.role / profiles.is_admin
 * - drivers row + approved (variant A)
 * - latest driver_applications.status (for pending/register UX)
 *
 * Rules:
 * - Never redirect while loading=true (caller decides)
 * - Role truth source: profiles.role (mode)
 * - Driver access source: drivers.approved (approval)
 */
export function useSessionProfile(options = {}) {
  const { includeDriver = true, includeApplication = true } = options;

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  const [profile, setProfile] = useState(null); // { role, is_admin, ... }
  const [driverRow, setDriverRow] = useState(null);
  const [application, setApplication] = useState(null);

  const mountedRef = useRef(true);

  const auth = useAuthOptional();
  const externalSession = auth?.session ?? null;
  const externalReady = auth ? auth.authReady : false;

  const user = session?.user ?? null;
  const userId = user?.id ?? null;

  const role = profile?.role ?? null;
  const isAdmin = !!profile?.is_admin;

  const deriveDriverApproved = (drv) => {
    if (!drv) return false;

    if (Object.prototype.hasOwnProperty.call(drv, "approved") && typeof drv.approved === "boolean") {
      return drv.approved;
    }

    if (Object.prototype.hasOwnProperty.call(drv, "status") && typeof drv.status === "string") {
      const s = drv.status.trim().toLowerCase();
      return ["approved", "active", "verified", "enabled", "ok"].includes(s);
    }

    // Legacy variants without explicit approval: treat row existence as approved
    return true;
  };

  const driverExists = !!driverRow;
  const driverApproved = useMemo(() => deriveDriverApproved(driverRow), [driverRow]);

  const applicationStatus = useMemo(() => {
    const s = application?.status;
    return typeof s === "string" ? s.trim().toLowerCase() : null;
  }, [application]);

  useEffect(() => {
    mountedRef.current = true;

    let alive = true;

    const setSafe = (fn) => {
      if (!mountedRef.current || !alive) return;
      fn();
    };

    const fetchAll = async (nextSession) => {
      setSafe(() => {
        setSession(nextSession ?? null);
        setLoading(true);
      });

      const uid = nextSession?.user?.id ?? null;

      if (!uid) {
        setSafe(() => {
          setProfile(null);
          setDriverRow(null);
          setApplication(null);
          setLoading(false);
        });
        return;
      }

      try {
        const [profRes, drvRes, appRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("user_id", uid).maybeSingle(),
          includeDriver
            ? supabase.from("drivers").select("*").eq("user_id", uid).maybeSingle()
            : Promise.resolve({ data: null, error: null }),
          includeApplication
            ? supabase
                .from("driver_applications")
                .select("*")
                .eq("user_id", uid)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ]);

        if (profRes?.error) console.error("profiles select error:", profRes.error);
        if (drvRes?.error) console.error("drivers select error:", drvRes.error);
        if (appRes?.error) console.error("driver_applications select error:", appRes.error);

        setSafe(() => {
          setProfile(profRes?.data ?? null);
          setDriverRow(drvRes?.data ?? null);
          setApplication(appRes?.data ?? null);
          setLoading(false);
        });
      } catch (e) {
        console.error("useSessionProfile fetchAll error:", e);
        setSafe(() => setLoading(false));
      }
    };

    // When AuthProvider is present, we rely on its session + readiness to avoid double subscriptions.
    if (auth) {
      if (!externalReady) {
        setSafe(() => setLoading(true));
      } else {
        fetchAll(externalSession);
      }

      return () => {
        alive = false;
        mountedRef.current = false;
      };
    }

    // Standalone mode (no AuthProvider): subscribe ourselves.
    let unsub = null;

    const init = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("getSession error:", error);
        setSafe(() => setLoading(false));
        return;
      }

      await fetchAll(data?.session ?? null);

      const { data: sub } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
        await fetchAll(nextSession);
      });

      unsub = () => sub?.subscription?.unsubscribe?.();
    };

    init();

    return () => {
      alive = false;
      mountedRef.current = false;
      if (typeof unsub === "function") unsub();
    };
  }, [includeDriver, includeApplication, auth, externalSession, externalReady]);

  return {
    loading,
    session,
    user,
    userId,
    profile,
    role,
    isAdmin,
    driverRow,
    driverExists,
    driverApproved,
    application,
    applicationStatus,
  };
}