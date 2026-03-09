import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";

const AuthCtx = createContext(null);

function normalizeRole(value) {
  const role = String(value || "client").trim().toLowerCase();
  if (["admin", "driver", "client"].includes(role)) return role;
  return "client";
}

function normalizeStatus(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : null;
}

function deriveDriverApproved(driver) {
  if (!driver) return false;

  if (typeof driver.approved === "boolean") return driver.approved;
  if (typeof driver.is_approved === "boolean") return driver.is_approved;

  const status = normalizeStatus(driver.status);
  if (status) {
    return ["approved", "active", "verified", "enabled", "ok"].includes(status);
  }

  return true;
}

async function fetchProfileByUserId(userId) {
  const attempts = [
    () => supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    () => supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
  ];

  for (const attempt of attempts) {
    const res = await attempt();
    if (!res.error) return { data: res.data ?? null, error: null };

    const msg = String(res.error?.message || "");
    const code = String(res.error?.code || "");

    const retriableMissingColumn = code === "42703" || /column/i.test(msg);
    if (!retriableMissingColumn) return { data: null, error: res.error };
  }

  return { data: null, error: null };
}

async function upsertMinimalClientProfile(user) {
  if (!user?.id) return { data: null, error: null };

  const payload = {
    id: user.id,
    role: "client",
    updated_at: new Date().toISOString(),
  };

  if (user.email) payload.email = user.email;
  if (user.phone) payload.phone = user.phone;

  let res = await supabase.from("profiles").upsert(payload, { onConflict: "id" }).select("*").maybeSingle();

  if (res.error && /column\s+"id"\s+does\s+not\s+exist/i.test(String(res.error.message || ""))) {
    const payload2 = {
      user_id: user.id,
      role: "client",
      updated_at: payload.updated_at,
    };
    if (user.email) payload2.email = user.email;
    if (user.phone) payload2.phone = user.phone;

    res = await supabase.from("profiles").upsert(payload2, { onConflict: "user_id" }).select("*").maybeSingle();
  }

  return { data: res.data ?? null, error: res.error ?? null };
}

function emptyResolvedState(session = null) {
  const user = session?.user ?? null;
  return {
    session,
    user,
    profile: null,
    role: user ? "client" : null,
    isAdmin: false,
    driver: null,
    driverRow: null,
    driverExists: false,
    driverApproved: false,
    driverApp: null,
    application: null,
    applicationStatus: null,
    error: null,
  };
}

export function AuthProvider({ children }) {
  const [state, setState] = useState(() => ({
    ...emptyResolvedState(null),
    loading: true,
    authReady: false,
    isAuthed: false,
    lastResolvedUserId: null,
    lastSessionFingerprint: null,
  }));

  const mountedRef = useRef(false);
  const inFlightRef = useRef(false);
  const queuedSessionRef = useRef(undefined);
  const lastHandledEventRef = useRef("");
  const eventTimerRef = useRef(null);

  const commit = useCallback((updater) => {
    if (!mountedRef.current) return;
    setState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      return next;
    });
  }, []);

  const sessionFingerprint = useCallback((session) => {
    const userId = session?.user?.id || "anon";
    const access = session?.access_token ? String(session.access_token).slice(-12) : "none";
    return `${userId}:${access}`;
  }, []);

  const resolveSession = useCallback(async (incomingSession, reason = "unknown") => {
    const requestedSession = incomingSession ?? null;

    if (inFlightRef.current) {
      queuedSessionRef.current = requestedSession;
      return;
    }

    inFlightRef.current = true;

    try {
      commit((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      if (!requestedSession?.user?.id) {
        commit((prev) => ({
          ...prev,
          ...emptyResolvedState(null),
          loading: false,
          authReady: true,
          isAuthed: false,
          lastResolvedUserId: null,
          lastSessionFingerprint: null,
          error: null,
        }));
        return;
      }

      const user = requestedSession.user;
      const userId = user.id;
      const fingerprint = sessionFingerprint(requestedSession);

      const [profileRes, driverRes, appRes] = await Promise.all([
        fetchProfileByUserId(userId),
        supabase.from("drivers").select("*").eq("user_id", userId).maybeSingle(),
        supabase
          .from("driver_applications")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      let profile = profileRes.data ?? null;
      let profileError = profileRes.error ?? null;

      if (!profile && !profileError) {
        const created = await upsertMinimalClientProfile(user);
        if (!created.error) {
          profile = created.data ?? null;
        } else {
          profileError = created.error;
        }
      }

      const driver = driverRes.error ? null : driverRes.data ?? null;
      const driverApp = appRes.error ? null : appRes.data ?? null;

      const role = normalizeRole(profile?.role || (driver || driverApp ? "driver" : "client"));
      const isAdmin = !!profile?.is_admin;
      const driverApproved = deriveDriverApproved(driver) || normalizeStatus(driverApp?.status) === "approved";
      const applicationStatus = normalizeStatus(driverApp?.status);

      commit((prev) => ({
        ...prev,
        session: requestedSession,
        user,
        profile,
        role,
        isAdmin,
        driver,
        driverRow: driver,
        driverExists: !!driver,
        driverApproved,
        driverApp,
        application: driverApp,
        applicationStatus,
        loading: false,
        authReady: true,
        isAuthed: true,
        lastResolvedUserId: userId,
        lastSessionFingerprint: fingerprint,
        error: profileError || driverRes.error || appRes.error || null,
        lastReason: reason,
      }));
    } catch (error) {
      console.error("[AuthProvider] resolveSession error", error);
      commit((prev) => ({
        ...prev,
        ...emptyResolvedState(requestedSession),
        loading: false,
        authReady: true,
        isAuthed: !!requestedSession?.user,
        lastResolvedUserId: requestedSession?.user?.id || null,
        lastSessionFingerprint: sessionFingerprint(requestedSession),
        error,
        lastReason: reason,
      }));
    } finally {
      inFlightRef.current = false;

      if (queuedSessionRef.current !== undefined) {
        const next = queuedSessionRef.current;
        queuedSessionRef.current = undefined;
        if (sessionFingerprint(next) !== state.lastSessionFingerprint) {
          void resolveSession(next, "queued");
        }
      }
    }
  }, [commit, sessionFingerprint, state.lastSessionFingerprint]);

  const refetch = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("[AuthProvider] refetch getSession error", error);
      commit((prev) => ({ ...prev, loading: false, authReady: true, error }));
      return;
    }
    await resolveSession(data?.session ?? null, "manual-refetch");
  }, [commit, resolveSession]);

  useEffect(() => {
    mountedRef.current = true;

    const boot = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("[AuthProvider] getSession error", error);
          commit((prev) => ({
            ...prev,
            ...emptyResolvedState(null),
            loading: false,
            authReady: true,
            isAuthed: false,
            error,
          }));
          return;
        }

        await resolveSession(data?.session ?? null, "bootstrap");
      } catch (error) {
        console.error("[AuthProvider] bootstrap crash", error);
        commit((prev) => ({
          ...prev,
          ...emptyResolvedState(null),
          loading: false,
          authReady: true,
          isAuthed: false,
          error,
        }));
      }
    };

    void boot();

    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      const fingerprint = `${event}:${sessionFingerprint(nextSession)}`;
      if (lastHandledEventRef.current === fingerprint) return;
      lastHandledEventRef.current = fingerprint;

      if (eventTimerRef.current) clearTimeout(eventTimerRef.current);
      eventTimerRef.current = window.setTimeout(() => {
        void resolveSession(nextSession ?? null, `auth:${event}`);
      }, event === "INITIAL_SESSION" ? 0 : 120);
    });

    return () => {
      mountedRef.current = false;
      if (eventTimerRef.current) clearTimeout(eventTimerRef.current);
      sub?.subscription?.unsubscribe?.();
    };
  }, [commit, resolveSession, sessionFingerprint]);

  const value = useMemo(() => ({
    ...state,
    refetch,
    signOut: async () => {
      try {
        await supabase.auth.signOut();
      } finally {
        commit((prev) => ({
          ...prev,
          ...emptyResolvedState(null),
          loading: false,
          authReady: true,
          isAuthed: false,
          error: null,
        }));
      }
    },
  }), [commit, refetch, state]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
