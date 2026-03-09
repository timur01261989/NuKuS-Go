import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

const SESSION_TIMEOUT_MS = 7000;
const QUERY_TIMEOUT_MS = 7000;
const AUTH_EVENT_DEBOUNCE_MS = 200;

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

function getSessionIdentity(session) {
  return session?.user?.id || null;
}

function isSameLogicalSession(a, b) {
  return getSessionIdentity(a) === getSessionIdentity(b);
}

export function useSessionProfile(options = {}) {
  const { includeDriver = true, includeApplication = true } = options;

  const mountedRef = useRef(false);
  const lastSessionRef = useRef(null);
  const lastFetchedUserIdRef = useRef(undefined);
  const inFlightRef = useRef(false);
  const queuedSessionRef = useRef(undefined);
  const requestIdRef = useRef(0);
  const authEventTimerRef = useRef(null);
  const unsubRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [driverRow, setDriverRow] = useState(null);
  const [application, setApplication] = useState(null);

  const commitState = useCallback((next) => {
    if (!mountedRef.current) return;
    setSession(next.session ?? null);
    setProfile(next.profile ?? null);
    setDriverRow(next.driverRow ?? null);
    setApplication(next.application ?? null);
    setLoading(next.loading ?? false);
  }, []);

  const commitEmptyState = useCallback(
    (nextSession = null) => {
      lastSessionRef.current = nextSession ?? null;
      lastFetchedUserIdRef.current = getSessionIdentity(nextSession);
      commitState({
        session: nextSession ?? null,
        profile: null,
        driverRow: null,
        application: null,
        loading: false,
      });
    },
    [commitState]
  );

  const fetchSessionData = useCallback(
    async (nextSession, reason = "manual") => {
      const normalizedSession = nextSession ?? null;
      const userId = getSessionIdentity(normalizedSession);

      if (inFlightRef.current) {
        queuedSessionRef.current = { session: normalizedSession, reason };
        return;
      }

      if (
        lastFetchedUserIdRef.current === userId &&
        isSameLogicalSession(lastSessionRef.current, normalizedSession)
      ) {
        if (mountedRef.current) {
          setLoading(false);
        }
        return;
      }

      inFlightRef.current = true;
      queuedSessionRef.current = undefined;
      requestIdRef.current += 1;
      const requestId = requestIdRef.current;

      if (mountedRef.current) {
        setLoading(true);
      }

      if (!userId) {
        commitEmptyState(null);
        inFlightRef.current = false;
        if (queuedSessionRef.current) {
          const queued = queuedSessionRef.current;
          queuedSessionRef.current = undefined;
          fetchSessionData(queued.session, queued.reason);
        }
        return;
      }

      try {
        const profilePromise = withTimeout(
          supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
          QUERY_TIMEOUT_MS,
          "profiles query"
        );

        const driverPromise = includeDriver
          ? withTimeout(
              supabase.from("drivers").select("*").eq("user_id", userId).maybeSingle(),
              QUERY_TIMEOUT_MS,
              "drivers query"
            )
          : Promise.resolve({ data: null, error: null });

        const applicationPromise = includeApplication
          ? withTimeout(
              supabase
                .from("driver_applications")
                .select("*")
                .eq("user_id", userId)
                .order("submitted_at", { ascending: false })
                .limit(1)
                .maybeSingle(),
              QUERY_TIMEOUT_MS,
              "driver_applications query"
            )
          : Promise.resolve({ data: null, error: null });

        const [profileRes, driverRes, applicationRes] = await Promise.all([
          profilePromise,
          driverPromise,
          applicationPromise,
        ]);

        if (!mountedRef.current || requestId !== requestIdRef.current) {
          inFlightRef.current = false;
          return;
        }

        if (profileRes?.error) throw profileRes.error;
        if (driverRes?.error) throw driverRes.error;
        if (applicationRes?.error) throw applicationRes.error;

        lastSessionRef.current = normalizedSession;
        lastFetchedUserIdRef.current = userId;

        commitState({
          session: normalizedSession,
          profile: normalizeProfile(profileRes?.data || null),
          driverRow: normalizeDriver(driverRes?.data || null),
          application: normalizeApplication(applicationRes?.data || null),
          loading: false,
        });
      } catch (error) {
        console.error(`[useSessionProfile] ${reason} failed:`, error);

        if (!mountedRef.current || requestId !== requestIdRef.current) {
          inFlightRef.current = false;
          return;
        }

        const message = String(error?.message || "").toLowerCase();
        const isAuthFailure =
          message.includes("refresh token") ||
          message.includes("invalid refresh token") ||
          message.includes("jwt") ||
          message.includes("auth") ||
          message.includes("session") ||
          message.includes("token") ||
          message.includes("401") ||
          message.includes("403");

        if (isAuthFailure) {
          try {
            clearSupabaseBrowserStorage();
            await supabase.auth.signOut({ scope: "local" });
          } catch (signOutError) {
            console.warn("[useSessionProfile] local signOut skipped:", signOutError);
          }
          lastSessionRef.current = null;
          lastFetchedUserIdRef.current = null;
          commitEmptyState(null);
        } else {
          lastSessionRef.current = normalizedSession;
          lastFetchedUserIdRef.current = userId;
          commitState({
            session: normalizedSession,
            profile: null,
            driverRow: null,
            application: null,
            loading: false,
          });
        }
      } finally {
        inFlightRef.current = false;
        if (queuedSessionRef.current) {
          const queued = queuedSessionRef.current;
          queuedSessionRef.current = undefined;

          const queuedUserId = getSessionIdentity(queued.session);
          const currentUserId = getSessionIdentity(lastSessionRef.current);
          if (queuedUserId !== currentUserId) {
            fetchSessionData(queued.session, queued.reason);
          }
        }
      }
    },
    [commitEmptyState, commitState, includeApplication, includeDriver]
  );

  useEffect(() => {
    mountedRef.current = true;

    async function bootstrap() {
      try {
        const { data, error } = await withTimeout(
          supabase.auth.getSession(),
          SESSION_TIMEOUT_MS,
          "getSession"
        );

        if (!mountedRef.current) return;

        if (error) {
          console.error("[useSessionProfile] getSession error:", error);
          commitEmptyState(null);
          return;
        }

        await fetchSessionData(data?.session ?? null, "bootstrap");
      } catch (error) {
        console.error("[useSessionProfile] bootstrap failed:", error);
        if (!mountedRef.current) return;
        commitEmptyState(null);
      }
    }

    bootstrap();

    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mountedRef.current) return;

      if (authEventTimerRef.current) {
        clearTimeout(authEventTimerRef.current);
      }

      authEventTimerRef.current = setTimeout(() => {
        if (!mountedRef.current) return;

        if (event === "SIGNED_OUT") {
          lastSessionRef.current = null;
          lastFetchedUserIdRef.current = null;
          commitEmptyState(null);
          return;
        }

        const currentUserId = getSessionIdentity(lastSessionRef.current);
        const nextUserId = getSessionIdentity(nextSession);

        if (currentUserId === nextUserId && lastFetchedUserIdRef.current === nextUserId) {
          setLoading(false);
          return;
        }

        fetchSessionData(nextSession ?? null, `auth:${event || "UNKNOWN"}`);
      }, AUTH_EVENT_DEBOUNCE_MS);
    });

    unsubRef.current = sub?.subscription ?? null;

    return () => {
      mountedRef.current = false;
      if (authEventTimerRef.current) {
        clearTimeout(authEventTimerRef.current);
        authEventTimerRef.current = null;
      }
      unsubRef.current?.unsubscribe?.();
      unsubRef.current = null;
    };
  }, [commitEmptyState, fetchSessionData]);

  const refetch = useCallback(() => {
    lastFetchedUserIdRef.current = undefined;
    fetchSessionData(lastSessionRef.current, "refetch");
  }, [fetchSessionData]);

  const user = session?.user ?? null;
  const userId = user?.id ?? null;
  const role = profile?.role ?? "client";
  const isAdmin = !!profile?.is_admin;
  const driverExists = !!driverRow;
  const driverApproved = !!driverRow?.is_verified;
  const applicationStatus = application?.status ?? null;
  const transportType = driverRow?.transport_type || application?.transport_type || null;
  const allowedServices = useMemo(
    () => (Array.isArray(driverRow?.allowed_services) ? driverRow.allowed_services : []),
    [driverRow]
  );

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
    refetch,
  };
}

export default useSessionProfile;
