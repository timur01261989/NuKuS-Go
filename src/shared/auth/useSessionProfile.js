import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

/**
 * ============================================================================
 * KONSTANTALAR VA SOZLAMALAR
 * ============================================================================
 */
const SESSION_TIMEOUT_MS = 7000;
const QUERY_TIMEOUT_MS = 7000;
const AUTH_EVENT_DEBOUNCE_MS = 200;

/**
 * withTimeout
 * Berilgan promisni ma'lum vaqt ichida bajarilishini tekshiradi.
 * Agar vaqt o'tib ketsa, error qaytaradi.
 */
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

/**
 * clearSupabaseBrowserStorage
 * Brauzer xotirasidagi barcha Supabase bilan bog'liq eski tokenlarni tozalaydi.
 * Bu tizimdan chiqishda yoki session buzilganda xavfsizlikni ta'minlaydi.
 */
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
      console.warn("[SessionProfile] storage cleanup skipped:", error);
    }
  };

  clearStore(window.localStorage);
  clearStore(window.sessionStorage);
}

/**
 * ============================================================================
 * MAIN HOOK: useSessionProfile
 * ============================================================================
 */
export function useSessionProfile(options = {}) {
  const { includeDriver = false, includeApplication = false } = options;

  // --- STATE MANAGEMENT ---
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [driverRow, setDriverRow] = useState(null);
  const [application, setApplication] = useState(null);

  // --- REFS (Mantiqiy nazorat uchun) ---
  const mountedRef = useRef(true);
  const lastFetchedUserIdRef = useRef(undefined);
  const lastSessionRef = useRef(null);
  const authEventTimerRef = useRef(null);
  const unsubRef = useRef(null);

  /**
   * commitEmptyState
   * Barcha ma'lumotlarni null holatiga qaytaradi.
   */
  const commitEmptyState = useCallback(() => {
    if (!mountedRef.current) return;
    console.log("[useSessionProfile] Committing empty state.");
    setSession(null);
    setProfile(null);
    setDriverRow(null);
    setApplication(null);
    setLoading(false);
  }, []);

  /**
   * fetchSessionData
   * Asosiy ma'lumotlarni yuklash funksiyasi.
   * Yagona ID tizimi bo'yicha 'user_id' ustunidan foydalanadi.
   */
  const fetchSessionData = useCallback(
    async (currentSession, triggerSource = "unknown") => {
      if (!mountedRef.current) return;

      console.log(`[useSessionProfile] Fetching data. Source: ${triggerSource}`);

      if (!currentSession?.user?.id) {
        lastFetchedUserIdRef.current = undefined;
        commitEmptyState();
        return;
      }

      const uid = currentSession.user.id;

      // Agar ID o'zgarmagan bo'lsa va allaqachon yuklangan bo'lsa, qayta yuklamaslik
      if (uid === lastFetchedUserIdRef.current && !loading) {
        console.log("[useSessionProfile] UID unchanged, skipping fetch.");
        return;
      }

      try {
        setLoading(true);

        // 1. PROFILES (Primary Key: id)
        const profilePromise = supabase
          .from("profiles")
          .select("*")
          .eq("id", uid)
          .maybeSingle();

        const profileRes = await withTimeout(profilePromise, QUERY_TIMEOUT_MS, "profile fetch");
        const profileData = profileRes?.data || null;

        // 2. DRIVERS (Yagona ID: user_id)
        let driverData = null;
        if (includeDriver && uid) {
          const driverPromise = supabase
            .from("drivers")
            .select("*")
            .eq("user_id", uid)
            .maybeSingle();
          const driverRes = await withTimeout(driverPromise, QUERY_TIMEOUT_MS, "driver fetch");
          driverData = driverRes?.data || null;
        }

        // 3. DRIVER APPLICATIONS (Yagona ID: user_id)
        let appData = null;
        if (includeApplication && uid) {
          const appPromise = supabase
            .from("driver_applications")
            .select("*")
            .eq("user_id", uid)
            .maybeSingle();
          const appRes = await withTimeout(appPromise, QUERY_TIMEOUT_MS, "application fetch");
          appData = appRes?.data || null;
        }

        if (!mountedRef.current) return;

        // Ma'lumotlarni saqlash
        setSession(currentSession);
        setProfile(profileData);
        setDriverRow(driverData);
        setApplication(appData);

        lastFetchedUserIdRef.current = uid;
        lastSessionRef.current = currentSession;

        console.log("[useSessionProfile] Data fetch success for UID:", uid);
      } catch (err) {
        console.error(`[useSessionProfile] Critical error in fetchSessionData (${triggerSource}):`, err);
        if (mountedRef.current) {
          setProfile(null);
          setDriverRow(null);
          setApplication(null);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [includeDriver, includeApplication, commitEmptyState, loading]
  );

  /**
   * INITIALIZATION & AUTH LISTENERS
   */
  useEffect(() => {
    mountedRef.current = true;

    const initAuth = async () => {
      try {
        console.log("[useSessionProfile] Initializing auth session...");
        const { data, error } = await withTimeout(
          supabase.auth.getSession(),
          SESSION_TIMEOUT_MS,
          "getSession"
        );
        if (error) throw error;
        await fetchSessionData(data?.session, "init_auth");
      } catch (err) {
        console.error("[useSessionProfile] initAuth failed or timed out:", err);
        clearSupabaseBrowserStorage();
        commitEmptyState();
      }
    };

    initAuth();

    // Supabase Auth holati o'zgarishini kuzatish
    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mountedRef.current) return;

      console.log(`[useSessionProfile] Auth Event: ${event}`);

      if (event === "SIGNED_OUT") {
        lastFetchedUserIdRef.current = undefined;
        lastSessionRef.current = null;
        clearSupabaseBrowserStorage();
        commitEmptyState();
        return;
      }

      if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN" || event === "USER_UPDATED") {
        if (authEventTimerRef.current) {
          clearTimeout(authEventTimerRef.current);
        }

        authEventTimerRef.current = setTimeout(() => {
          fetchSessionData(nextSession ?? null, `auth_event_${event}`);
        }, AUTH_EVENT_DEBOUNCE_MS);
      }
    });

    unsubRef.current = sub?.subscription ?? null;

    return () => {
      mountedRef.current = false;
      if (authEventTimerRef.current) {
        clearTimeout(authEventTimerRef.current);
        authEventTimerRef.current = null;
      }
      if (unsubRef.current) {
        unsubRef.current.unsubscribe();
        unsubRef.current = null;
      }
      console.log("[useSessionProfile] Hook unmounted.");
    };
  }, [commitEmptyState, fetchSessionData]);

  /**
   * refetch
   * Ma'lumotlarni qo'lda yangilash imkoniyati.
   */
  const refetch = useCallback(() => {
    console.log("[useSessionProfile] Manual refetch triggered.");
    lastFetchedUserIdRef.current = undefined;
    fetchSessionData(lastSessionRef.current, "manual_refetch");
  }, [fetchSessionData]);

  /**
   * ============================================================================
   * DERIVED VALUES (Frontend qulayligi uchun)
   * ============================================================================
   */
  const user = session?.user ?? null;
  const userId = user?.id ?? null;
  
  // Rolni aniqlash
  const role = profile?.current_role ?? profile?.role ?? "client";
  const isAdmin = role === "admin" || !!profile?.is_admin;
  
  // Haydovchi holati
  const driverExists = !!driverRow;
  const driverApproved = !!driverRow?.is_verified;
  const applicationStatus = application?.status ?? null;
  
  // Texnik parametrlar
  const transportType = driverRow?.transport_type || application?.transport_type || null;
  
  const allowedServices = useMemo(() => {
    if (Array.isArray(driverRow?.allowed_services)) {
      return driverRow.allowed_services;
    }
    return [];
  }, [driverRow]);

  /**
   * RETURN STATEMENT
   * Barcha state va helperlarni qaytaramiz.
   */
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
    applicationStatus,
    transportType,
    allowedServices,
    refetch,
    // Debug uchun qo'shimcha flaglar
    isAuthReady: !loading,
    hasSession: !!session
  };
}