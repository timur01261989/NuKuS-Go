import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const verified =
    row.is_verified === true ||
    row.approved === true ||
    String(row.status || "").toLowerCase() === "approved" ||
    String(row.status || "").toLowerCase() === "active";

  return {
    ...row,
    approved: verified,
    is_verified: verified,
    allowed_services: Array.isArray(row.allowed_services) ? row.allowed_services : [],
  };
}

function buildSessionKey(nextSession) {
  const uid = nextSession?.user?.id ?? "anon";
  const access = nextSession?.access_token ?? "";
  return `${uid}:${access}`;
}

export function useSessionProfile(options = {}) {
  const { includeDriver = true, includeApplication = true } = options;

  const mounted = useRef(true);
  const inFlightRef = useRef(false);
  const queuedSessionRef = useRef(undefined);
  const bootstrappedRef = useRef(false);
  const lastCommittedKeyRef = useRef("");
  const authDebounceRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [driverRow, setDriverRow] = useState(null);
  const [application, setApplication] = useState(null);
  const [error, setError] = useState(null);

  const commitEmptyState = useCallback((nextSession = null, nextError = null) => {
    if (!mounted.current) return;
    setSession(nextSession ?? null);
    setProfile(null);
    setDriverRow(null);
    setApplication(null);
    setError(nextError ?? null);
    setLoading(false);
  }, []);

  const fetchAll = useCallback(
    async (nextSession, reason = "normal") => {
      const requestKey = buildSessionKey(nextSession);

      if (inFlightRef.current) {
        queuedSessionRef.current = { nextSession, reason };
        return;
      }

      // Avoid useless duplicate fetches for the same already-committed session.
      if (
        requestKey === lastCommittedKeyRef.current &&
        reason !== "refetch" &&
        reason !== "auth-change"
      ) {
        if (mounted.current) {
          setSession(nextSession ?? null);
          setLoading(false);
        }
        return;
      }

      inFlightRef.current = true;
      if (mounted.current) {
        setLoading(true);
        setError(null);
      }

      const uid = nextSession?.user?.id ?? null;

      if (!uid) {
        lastCommittedKeyRef.current = requestKey;
        inFlightRef.current = false;
        commitEmptyState(nextSession ?? null, null);
        return;
      }

      try {
        const profilePromise = supabase
          .from("profiles")
          .select("*")
          .eq("id", uid)
          .maybeSingle();

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
          setError(null);
          setLoading(false);
        }

        lastCommittedKeyRef.current = requestKey;
      } catch (err) {
        console.error("useSessionProfile error:", err);
        if (mounted.current) {
          setSession(nextSession ?? null);
          setProfile(null);
          setDriverRow(null);
          setApplication(null);
          setError(err ?? null);
          setLoading(false);
        }
      } finally {
        inFlightRef.current = false;

        if (queuedSessionRef.current) {
          const queued = queuedSessionRef.current;
          queuedSessionRef.current = undefined;
          void fetchAll(queued.nextSession ?? null, queued.reason || "queued");
        }
      }
    },
    [commitEmptyState, includeApplication, includeDriver]
  );

  useEffect(() => {
    mounted.current = true;

    if (!bootstrappedRef.current) {
      bootstrappedRef.current = true;
      supabase.auth
        .getSession()
        .then(({ data, error: sessionError }) => {
          if (sessionError) {
            console.error("useSessionProfile getSession error:", sessionError);
            commitEmptyState(null, sessionError);
            return;
          }
          void fetchAll(data?.session ?? null, "bootstrap");
        })
        .catch((err) => {
          console.error("useSessionProfile bootstrap crash:", err);
          commitEmptyState(null, err);
        });
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (authDebounceRef.current) clearTimeout(authDebounceRef.current);
      authDebounceRef.current = setTimeout(() => {
        void fetchAll(nextSession ?? null, "auth-change");
      }, 120);
    });

    return () => {
      mounted.current = false;
      if (authDebounceRef.current) clearTimeout(authDebounceRef.current);
      sub?.subscription?.unsubscribe?.();
    };
  }, [commitEmptyState, fetchAll]);

  const user = session?.user ?? null;
  const userId = user?.id ?? null;
  const role = profile?.role ?? "client";
  const isAdmin = !!profile?.is_admin;
  const driverExists = !!driverRow;
  const driverApproved = !!driverRow?.is_verified;
  const applicationStatus = application?.status ?? null;
  const transportType = driverRow?.transport_type || application?.transport_type || null;
  const allowedServices = driverRow?.allowed_services ?? [];

  const refetch = useCallback(() => fetchAll(session, "refetch"), [fetchAll, session]);

  return useMemo(
    () => ({
      loading,
      error,
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
      refetch,
    }),
    [
      loading,
      error,
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
      transportType,
      allowedServices,
      refetch,
    ]
  );
}

export default useSessionProfile;
