import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

const SESSION_TIMEOUT_MS = 7000;
const QUERY_TIMEOUT_MS = 7000;
const AUTH_EVENT_DEBOUNCE_MS = 250;

function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label || "operation"} timeout after ${ms}ms`));
    }, ms);

    Promise.resolve(promise)
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function clearSupabaseBrowserStorage() {
  if (typeof window === "undefined") return;

  const clearStore = (store) => {
    try {
      const keys = [];
      for (let i = 0; i < store.length; i += 1) {
        const key = store.key(i);
        if (key) keys.push(key);
      }

      keys.forEach((key) => {
        const normalized = String(key || "").toLowerCase();
        if (
          normalized.includes("supabase") ||
          normalized.startsWith("sb-") ||
          normalized.includes("auth-token") ||
          normalized.includes("refresh-token")
        ) {
          store.removeItem(key);
        }
      });
    } catch (error) {
      console.warn("[useSessionProfile] storage cleanup skipped:", error);
    }
  };

  clearStore(window.localStorage);
  clearStore(window.sessionStorage);
}

function normalizeProfile(row) {
  if (!row) return null;
  const role = row.role || row.current_role || "client";
  return {
    ...row,
    role,
    current_role: row.current_role || role,
    is_admin: row.is_admin === true || role === "admin",
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

function sameSession(a, b) {
  const aUserId = a?.user?.id || null;
  const bUserId = b?.user?.id || null;
  const aAccess = a?.access_token || null;
  const bAccess = b?.access_token || null;
  const aRefresh = a?.refresh_token || null;
  const bRefresh = b?.refresh_token || null;

  return aUserId === bUserId && aAccess === bAccess && aRefresh === bRefresh;
}

function buildSessionKey(session) {
  const userId = session?.user?.id || "guest";
  const access = session?.access_token || "no-access";
  const refresh = session?.refresh_token || "no-refresh";
  return `${userId}:${access}:${refresh}`;
}

export function useSessionProfile(options = {}) {
  const { includeDriver = true, includeApplication = true } = options;

  const mountedRef = useRef(false);
  const refreshTimerRef = useRef(null);
  const inFlightRef = useRef(false);
  const queuedRef = useRef(null);
  const currentSessionRef = useRef(null);
  const lastFetchedKeyRef = useRef(null);
  const requestIdRef = useRef(0);

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [driverRow, setDriverRow] = useState(null);
  const [application, setApplication] = useState(null);

  const commitEmptyState = useCallback((nextSession = null) => {
    if (!mountedRef.current) return;
    currentSessionRef.current = nextSession ?? null;
    setSession(nextSession ?? null);
    setProfile(null);
    setDriverRow(null);
    setApplication(null);
    setLoading(false);
  }, []);

  const runFetch = useCallback(
    async (nextSession, reason = "manual") => {
      const normalizedSession = nextSession ?? null;
      const sessionKey = buildSessionKey(normalizedSession);

      if (inFlightRef.current) {
        queuedRef.current = { session: normalizedSession, reason };
        return;
      }

      if (lastFetchedKeyRef.current === sessionKey && sameSession(currentSessionRef.current, normalizedSession)) {
        if (mountedRef.current && loading) {
          setLoading(false);
        }
        return;
      }

      inFlightRef.current = true;
      queuedRef.current = null;
      requestIdRef.current += 1;
      const requestId = requestIdRef.current;

      if (mountedRef.current) {
        setLoading(true);
      }

      const uid = normalizedSession?.user?.id ?? null;

      if (!uid) {
        lastFetchedKeyRef.current = sessionKey;
        commitEmptyState(null);
        inFlightRef.current = false;
        if (queuedRef.current) {
          const queued = queuedRef.current;
          queuedRef.current = null;
          runFetch(queued.session, queued.reason);
        }
        return;
      }

      try {
        const profilePromise = withTimeout(
          supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
          QUERY_TIMEOUT_MS,
          "profiles query"
        );

        const driverPromise = includeDriver
          ? withTimeout(
              supabase.from("drivers").select("*").eq("user_id", uid).maybeSingle(),
              QUERY_TIMEOUT_MS,
              "drivers query"
            )
          : Promise.resolve({ data: null, error: null });

        const appPromise = includeApplication
          ? withTimeout(
              supabase
                .from("driver_applications")
                .select("*")
                .eq("user_id", uid)
                .order("submitted_at", { ascending: false })
                .limit(1)
                .maybeSingle(),
              QUERY_TIMEOUT_MS,
              "driver_applications query"
            )
          : Promise.resolve({ data: null, error: null });

        const [profileRes, driverRes, appRes] = await Promise.all([
          profilePromise,
          driverPromise,
          appPromise,
        ]);

        if (requestId !== requestIdRef.current || !mountedRef.current) {
          inFlightRef.current = false;
          return;
        }

        if (profileRes?.error) throw profileRes.error;
        if (driverRes?.error) throw driverRes.error;
        if (appRes?.error) throw appRes.error;

        currentSessionRef.current = normalizedSession;
        lastFetchedKeyRef.current = sessionKey;
        setSession(normalizedSession);
        setProfile(normalizeProfile(profileRes?.data || null));
        setDriverRow(normalizeDriver(driverRes?.data || null));
        setApplication(normalizeApplication(appRes?.data || null));
        setLoading(false);
      } catch (error) {
        console.error(`[useSessionProfile] ${reason} failed:`, error);

        if (requestId === requestIdRef.current && mountedRef.current) {
          const message = String(error?.message || "").toLowerCase();
          const isAuthFailure =
            message.includes("refresh token") ||
            message.includes("invalid refresh token") ||
            message.includes("jwt") ||
            message.includes("auth") ||
            message.includes("session") ||
            message.includes("token") ||
            message.includes("400") ||
            message.includes("401");

          if (isAuthFailure) {
            clearSupabaseBrowserStorage();
            try {
              await supabase.auth.signOut({ scope: "local" });
            } catch (signOutError) {
              console.warn("[useSessionProfile] local signOut skipped:", signOutError);
            }
            lastFetchedKeyRef.current = null;
            commitEmptyState(null);
          } else {
            currentSessionRef.current = normalizedSession;
            setSession(normalizedSession);
            setProfile(null);
            setDriverRow(null);
            setApplication(null);
            setLoading(false);
          }
        }
      } finally {
        inFlightRef.current = false;
        if (queuedRef.current) {
          const queued = queuedRef.current;
          queuedRef.current = null;
          runFetch(queued.session, queued.reason);
        }
      }
    },
    [commitEmptyState, includeApplication, includeDriver, loading]
  );

  useEffect(() => {
    mountedRef.current = true;

    const bootstrap = async () => {
      try {
        const { data, error } = await withTimeout(
          supabase.auth.getSession(),
          SESSION_TIMEOUT_MS,
          "auth.getSession"
        );

        if (!mountedRef.current) return;

        if (error) {
          console.error("[useSessionProfile] getSession error:", error);
          clearSupabaseBrowserStorage();
          commitEmptyState(null);
          return;
        }

        await runFetch(data?.session ?? null, "bootstrap");
      } catch (error) {
        console.error("[useSessionProfile] bootstrap session failed:", error);
        clearSupabaseBrowserStorage();
        commitEmptyState(null);
      }
    };

    bootstrap();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mountedRef.current) return;

      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }

      refreshTimerRef.current = setTimeout(() => {
        const normalizedSession = nextSession ?? null;

        if (event === "SIGNED_OUT") {
          lastFetchedKeyRef.current = null;
          commitEmptyState(null);
          return;
        }

        if (sameSession(currentSessionRef.current, normalizedSession)) {
          if (mountedRef.current && loading) {
            setLoading(false);
          }
          return;
        }

        runFetch(normalizedSession, `auth:${String(event || "unknown").toLowerCase()}`);
      }, AUTH_EVENT_DEBOUNCE_MS);
    });

    return () => {
      mountedRef.current = false;
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      authListener?.subscription?.unsubscribe?.();
    };
  }, [commitEmptyState, loading, runFetch]);

  const user = session?.user ?? null;
  const userId = user?.id ?? null;
  const role = profile?.role ?? "client";
  const isAdmin = !!profile?.is_admin;
  const driverExists = !!driverRow;
  const driverApproved = !!driverRow?.is_verified;
  const applicationStatus = application?.status ?? null;
  const transportType = driverRow?.transport_type || application?.transport_type || null;
  const allowedServices = Array.isArray(driverRow?.allowed_services) ? driverRow.allowed_services : [];

  const result = useMemo(
    () => ({
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
      refetch: () => runFetch(currentSessionRef.current, "refetch"),
    }),
    [
      allowedServices,
      application,
      applicationStatus,
      driverApproved,
      driverExists,
      driverRow,
      isAdmin,
      loading,
      profile,
      role,
      runFetch,
      session,
      transportType,
      user,
      userId,
    ]
  );

  return result;
}

export default useSessionProfile;
