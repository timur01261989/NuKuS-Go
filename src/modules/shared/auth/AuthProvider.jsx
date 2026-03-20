import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "@/services/supabase/supabaseClient.js";
import { bootstrapReferralSummary } from "@/services/referralApi.js";
import {
  clearOwnReferralSnapshot,
  persistOwnReferralSnapshot,
} from "@/services/referralLinkService.js";
import {
  buildSessionFingerprint,
  getSession,
  onAuthStateChange,
  resolveAuthSession,
  signOut as signOutRequest,
} from "../../../services/supabase/authService.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const mountedRef = useRef(false);
  const inFlightRef = useRef(false);
  const queuedSessionRef = useRef(undefined);
  const authDebounceRef = useRef(null);
  const lastAuthEventRef = useRef("");
  const lastResolvedFingerprintRef = useRef(null);

  const [state, setState] = useState(() => ({
    loading: true,
    authReady: false,
    isAuthed: false,
    session: null,
    user: null,
    profile: null,
    role: null,
    isAdmin: false,
    driver: null,
    driverRow: null,
    driverExists: false,
    driverApproved: false,
    driverApp: null,
    application: null,
    applicationStatus: null,
    transportType: null,
    allowedServices: [],
    error: null,
    lastResolvedUserId: null,
    lastSessionFingerprint: null,
    lastReason: "bootstrap",
  }));

  const commit = useCallback((updater) => {
    if (!mountedRef.current) return;
    setState((previousState) => {
      const nextState =
        typeof updater === "function" ? updater(previousState) : updater;
      return {
        ...previousState,
        ...nextState,
      };
    });
  }, []);

  const resolveSession = useCallback(
    async (incomingSession, reason = "unknown") => {
      const requestedSession = incomingSession ?? null;

      if (inFlightRef.current) {
        queuedSessionRef.current = requestedSession;
        return;
      }

      inFlightRef.current = true;
      commit({ loading: true, error: null });

      try {
        const resolved = await resolveAuthSession(requestedSession, reason);
        lastResolvedFingerprintRef.current =
          resolved?.lastSessionFingerprint ??
          buildSessionFingerprint(requestedSession);
        commit(resolved || {});
      } catch (error) {
        console.error("[AuthProvider] resolveSession error", error);
        commit({
          loading: false,
          authReady: true,
          isAuthed: !!requestedSession?.user,
          session: requestedSession,
          user: requestedSession?.user ?? null,
          role: requestedSession?.user ? "client" : null,
          error,
          lastResolvedUserId: requestedSession?.user?.id || null,
          lastSessionFingerprint: buildSessionFingerprint(requestedSession),
          lastReason: reason,
        });
      } finally {
        inFlightRef.current = false;
        if (queuedSessionRef.current !== undefined) {
          const queuedSession = queuedSessionRef.current;
          queuedSessionRef.current = undefined;
          if (
            buildSessionFingerprint(queuedSession) !==
            lastResolvedFingerprintRef.current
          ) {
            void resolveSession(queuedSession, "queued");
          }
        }
      }
    },
    [commit]
  );

  const refetch = useCallback(async () => {
    const { data, error } = await getSession();
    if (error) {
      console.error("[AuthProvider] getSession error", error);
      commit({ loading: false, authReady: true, error });
      return;
    }
    await resolveSession(data?.session ?? null, "manual-refetch");
  }, [commit, resolveSession]);

  const signOut = useCallback(async () => {
    clearOwnReferralSnapshot();
    await signOutRequest();
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    getSession()
      .then(({ data, error }) => {
        if (error) {
          console.error("[AuthProvider] bootstrap getSession error", error);
          if (error?.status === 400 || error?.status === 401) {
            void supabase.auth.signOut().catch(() => null);
          }
          commit({
            loading: false,
            authReady: true,
            isAuthed: false,
            session: null,
            user: null,
            error,
          });
          return;
        }

        lastResolvedFingerprintRef.current = buildSessionFingerprint(
          data?.session ?? null
        );
        void resolveSession(data?.session ?? null, "bootstrap");
      })
      .catch((error) => {
        console.error("[AuthProvider] bootstrap crash", error);
        commit({
          loading: false,
          authReady: true,
          isAuthed: false,
          session: null,
          user: null,
          error,
        });
      });

    const { data: authSubscription } = onAuthStateChange(
      (event, nextSession) => {
        const fingerprint = `${event}:${buildSessionFingerprint(nextSession)}`;
        if (lastAuthEventRef.current === fingerprint) return;
        lastAuthEventRef.current = fingerprint;

        if (authDebounceRef.current) {
          clearTimeout(authDebounceRef.current);
        }

        authDebounceRef.current = setTimeout(() => {
          void resolveSession(nextSession ?? null, `auth:${event || "change"}`);
        }, 120);
      }
    );

    return () => {
      mountedRef.current = false;
      if (authDebounceRef.current) {
        clearTimeout(authDebounceRef.current);
      }
      authSubscription?.unsubscribe?.();
    };
  }, [commit, resolveSession]);

  useEffect(() => {
    if (!state.authReady) return;
    if (!state.isAuthed || !state.user?.id) {
      clearOwnReferralSnapshot();
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const response = await bootstrapReferralSummary();
        if (!cancelled && response?.ok) {
          persistOwnReferralSnapshot(response);
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn(
            "[AuthProvider] referral bootstrap skipped",
            error?.message || error
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [state.authReady, state.isAuthed, state.user?.id]);

  const contextValue = useMemo(
    () => ({
      ...state,
      userId: state.user?.id ?? null,
      refetch,
      signOut,
    }),
    [refetch, signOut, state]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}

export default AuthProvider;
