import { ROUTES } from "@/app/router/routePaths.js";

const PENDING_STATUSES = new Set(["pending", "review", "submitted", "processing"]);
const REJECTED_STATUSES = new Set(["rejected", "declined", "cancelled"]);
const APPROVED_STATUSES = new Set(["approved", "active", "verified", "enabled", "ok"]);

export function normalizeStatus(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function selectAccessState(auth) {
  const isLoading = !auth?.authReady || !!auth?.loading;
  const isAuthed = !!auth?.isAuthed && !!auth?.user;
  const status = normalizeStatus(auth?.applicationStatus);
  const hasApplication = !!auth?.application || !!auth?.driverApp || !!status;
  const hasDriverRecord = !!auth?.driverExists || !!auth?.driver || !!auth?.driverRow;
  const isAdmin = !!auth?.isAdmin || String(auth?.role || "").trim().toLowerCase() === "admin";
  const isApproved = !!auth?.driverApproved || APPROVED_STATUSES.has(status);
  const isPending = !isApproved && PENDING_STATUSES.has(status);
  const isRejected = REJECTED_STATUSES.has(status);

  if (isLoading) {
    return {
      mode: "loading",
      appRole: null,
      routeTarget: null,
      status,
      isAuthed,
      isAdmin,
      hasApplication,
      hasDriverRecord,
      isApproved,
      isPending,
      isRejected,
    };
  }

  if (!isAuthed) {
    return {
      mode: "guest",
      appRole: "guest",
      routeTarget: ROUTES.auth.login,
      status,
      isAuthed,
      isAdmin,
      hasApplication,
      hasDriverRecord,
      isApproved,
      isPending,
      isRejected,
    };
  }

  if (isAdmin) {
    return {
      mode: "admin",
      appRole: "admin",
      routeTarget: ROUTES.client.home,
      status,
      isAuthed,
      isAdmin,
      hasApplication,
      hasDriverRecord,
      isApproved,
      isPending,
      isRejected,
    };
  }

  if (isApproved || (String(auth?.role || "").trim().toLowerCase() === "driver" && hasDriverRecord)) {
    return {
      mode: "driver_approved",
      appRole: "driver",
      routeTarget: ROUTES.driver.home,
      status,
      isAuthed,
      isAdmin,
      hasApplication,
      hasDriverRecord,
      isApproved: true,
      isPending: false,
      isRejected: false,
    };
  }

  if (isPending) {
    return {
      mode: "driver_pending",
      appRole: "driver",
      routeTarget: ROUTES.driver.pending,
      status,
      isAuthed,
      isAdmin,
      hasApplication: true,
      hasDriverRecord,
      isApproved: false,
      isPending: true,
      isRejected: false,
    };
  }

  if (isRejected) {
    return {
      mode: "driver_rejected",
      appRole: "client",
      routeTarget: ROUTES.driver.register,
      status,
      isAuthed,
      isAdmin,
      hasApplication: true,
      hasDriverRecord,
      isApproved: false,
      isPending: false,
      isRejected: true,
    };
  }

  if (hasApplication || hasDriverRecord || String(auth?.role || "").trim().toLowerCase() === "driver") {
    return {
      mode: "driver_unregistered",
      appRole: "driver",
      routeTarget: ROUTES.driver.register,
      status,
      isAuthed,
      isAdmin,
      hasApplication,
      hasDriverRecord,
      isApproved: false,
      isPending: false,
      isRejected: false,
    };
  }

  return {
    mode: "client",
    appRole: "client",
    routeTarget: ROUTES.client.home,
    status,
    isAuthed,
    isAdmin,
    hasApplication,
    hasDriverRecord,
    isApproved: false,
    isPending: false,
    isRejected: false,
  };
}

export function pickHomeForAuth(auth, appMode = "client") {
  const access = selectAccessState(auth);
  const normalizedMode = String(appMode || "client").trim().toLowerCase();

  if (access.mode === "loading") return null;
  if (access.mode === "guest") return ROUTES.auth.login;
  if (access.mode === "admin") return ROUTES.client.home;

  if (normalizedMode !== "driver") {
    return ROUTES.client.home;
  }

  if (access.mode === "driver_approved") return ROUTES.driver.home;
  if (access.mode === "driver_pending") return ROUTES.driver.pending;
  if (access.mode === "driver_rejected") return ROUTES.driver.register;
  if (access.mode === "driver_unregistered") return ROUTES.driver.register;
  return ROUTES.client.home;
}
