import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

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

    if (!supabase) {
      setLoading(false);
      return () => {
        mountedRef.current = false;
      };
    }

    const setSafe = (fn) => {
      if (!mountedRef.current) return;
      fn();
    };

    const fetchAll = async (nextSession) => {
      setSafe(() => setLoading(true));

      const uid = nextSession?.user?.id ?? null;

      if (!uid) {
        setSafe(() => {
          setSession(nextSession ?? null);
          setProfile(null);
          setDriverRow(null);
          setApplication(null);
          setLoading(false);
        });
        return;
      }

      try {
        // Profile (best-effort) — be resilient to schema differences.
        // Some DBs don't have profiles.is_admin; some use profiles.user_id instead of profiles.id.
        const selectWithKey = async (key, cols) => {
          const res = await supabase.from("profiles").select(cols).eq(key, uid).maybeSingle();
          return { data: res.data ?? null, error: res.error ?? null };
        };

        // 1) Try id + role,is_admin
        let { data: p, error: pErr } = await selectWithKey("id", "role,is_admin,updated_at");

        // 2) If id column missing, retry user_id
        if (pErr && /column\s+\"id\"\s+does\s+not\s+exist/i.test(pErr.message || "")) {
          ({ data: p, error: pErr } = await selectWithKey("user_id", "role,is_admin,updated_at"));
        }

        // 3) If is_admin column missing, retry without it (same key)
        if (pErr && /column\s+\"is_admin\"\s+does\s+not\s+exist/i.test(pErr.message || "")) {
          // try id first
          ({ data: p, error: pErr } = await selectWithKey("id", "role,updated_at"));
          if (pErr && /column\s+\"id\"\s+does\s+not\s+exist/i.test(pErr.message || "")) {
            ({ data: p, error: pErr } = await selectWithKey("user_id", "role,updated_at"));
          }
        }

        if (p && !p.role) p.role = "client";

        // Drivers row (Variant A, best-effort)
        let drv = null;
        if (includeDriver) {
          const { data: d, error: dErr } = await supabase.from("drivers").select("*").eq("user_id", uid).maybeSingle();
          if (!dErr) drv = d ?? null;
        }

        // Latest application status (best-effort)
        let app = null;
        if (includeApplication) {
          const { data: a, error: aErr } = await supabase
            .from("driver_applications")
            .select("status,created_at,updated_at")
            .eq("user_id", uid)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (!aErr) app = a ?? null;
        }

        setSafe(() => {
          setSession(nextSession ?? null);
          setProfile(!pErr && p ? p : null);
          setDriverRow(drv);
          setApplication(app);
          setLoading(false);
        });
      } catch (e) {
        console.error("useSessionProfile error:", e);
        setSafe(() => {
          setSession(nextSession ?? null);
          setProfile(null);
          setDriverRow(null);
          setApplication(null);
          setLoading(false);
        });
      }
    };

    const init = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("getSession error:", error);
        setSafe(() => setLoading(false));
        return;
      }
      await fetchAll(data?.session ?? null);
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      await fetchAll(nextSession);
    });

    return () => {
      mountedRef.current = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, [includeDriver, includeApplication]);

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