import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSession, onAuthStateChange, resolveAuthSession } from "../../../services/supabase/authService.js";

export function useSessionProfile(options = {}) {
  const { includeDriver = true, includeApplication = true } = options;

  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);
  const queuedSessionRef = useRef(undefined);
  const bootstrappedRef = useRef(false);
  const authDebounceRef = useRef(null);
  const lastCommittedFingerprintRef = useRef("");

  const [state, setState] = useState(() => ({
    loading: true,
    authReady: false,
    isAuthed: false,
    session: null,
    user: null,
    profile: null,
    role: null,
    isAdmin: false,
    driverRow: null,
    driver: null,
    driverExists: false,
    driverApproved: false,
    application: null,
    driverApp: null,
    applicationStatus: null,
    transportType: null,
    allowedServices: [],
    error: null,
    lastResolvedUserId: null,
    lastSessionFingerprint: null,
    lastReason: "bootstrap",
  }));

  const commit = useCallback((nextState) => {
    if (!mountedRef.current) return;
    setState((previousState) => ({
      ...previousState,
      ...nextState,
    }));
  }, []);

  const resolve = useCallback(
    async (nextSession, reason = "normal") => {
      if (inFlightRef.current) {
        queuedSessionRef.current = { session: nextSession ?? null, reason };
        return;
      }

      inFlightRef.current = true;
      commit({ loading: true, error: null });

      try {
        const resolved = await resolveAuthSession(nextSession ?? null, reason);
        const scopedResolved = {
          ...resolved,
          driverRow: includeDriver ? resolved.driverRow : null,
          driver: includeDriver ? resolved.driver : null,
          driverExists: includeDriver ? resolved.driverExists : false,
          driverApproved: includeDriver ? resolved.driverApproved : false,
          application: includeApplication ? resolved.application : null,
          driverApp: includeApplication ? resolved.driverApp : null,
          applicationStatus: includeApplication ? resolved.applicationStatus : null,
          transportType:
            includeDriver || includeApplication
              ? resolved.transportType
              : null,
          allowedServices: includeDriver ? resolved.allowedServices : [],
        };

        lastCommittedFingerprintRef.current = scopedResolved.lastSessionFingerprint || "";
        commit(scopedResolved);
      } catch (error) {
        console.error("[useSessionProfile] resolve error", error);
        commit({
          loading: false,
          authReady: true,
          isAuthed: !!nextSession?.user,
          session: nextSession ?? null,
          user: nextSession?.user ?? null,
          profile: null,
          role: nextSession?.user ? "client" : null,
          isAdmin: false,
          driverRow: null,
          driver: null,
          driverExists: false,
          driverApproved: false,
          application: null,
          driverApp: null,
          applicationStatus: null,
          transportType: null,
          allowedServices: [],
          error,
          lastResolvedUserId: nextSession?.user?.id || null,
          lastSessionFingerprint: lastCommittedFingerprintRef.current || null,
          lastReason: reason,
        });
      } finally {
        inFlightRef.current = false;

        if (queuedSessionRef.current) {
          const queued = queuedSessionRef.current;
          queuedSessionRef.current = undefined;
          void resolve(queued.session ?? null, queued.reason || "queued");
        }
      }
    },
    [commit, includeApplication, includeDriver]
  );

  useEffect(() => {
    mountedRef.current = true;

    if (!bootstrappedRef.current) {
      bootstrappedRef.current = true;
      getSession()
        .then(({ data, error }) => {
          if (error) {
            console.error("[useSessionProfile] getSession error", error);
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

          void resolve(data?.session ?? null, "bootstrap");
        })
        .catch((error) => {
          console.error("[useSessionProfile] bootstrap error", error);
          commit({
            loading: false,
            authReady: true,
            isAuthed: false,
            session: null,
            user: null,
            error,
          });
        });
    }

    const { data: subscription } = onAuthStateChange((_event, nextSession) => {
      if (authDebounceRef.current) {
        clearTimeout(authDebounceRef.current);
      }

      authDebounceRef.current = setTimeout(() => {
        void resolve(nextSession ?? null, "auth-change");
      }, 120);
    });

    return () => {
      mountedRef.current = false;
      if (authDebounceRef.current) {
        clearTimeout(authDebounceRef.current);
      }
      subscription?.subscription?.unsubscribe?.();
    };
  }, [commit, resolve]);

  const refetch = useCallback(async () => {
    const { data, error } = await getSession();
    if (error) {
      commit({ loading: false, authReady: true, error });
      return;
    }

    await resolve(data?.session ?? null, "refetch");
  }, [commit, resolve]);

  return useMemo(
    () => ({
      ...state,
      userId: state.user?.id ?? null,
      refetch,
    }),
    [refetch, state]
  );
}

export default useSessionProfile;
