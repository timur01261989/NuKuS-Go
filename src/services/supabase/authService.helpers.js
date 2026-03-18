import { supabase } from "./supabaseClient.js";

export async function maybeSelectSingle(table, columns, filters = []) {
  let query = supabase.from(table).select(columns);
  for (const filter of filters) {
    if (filter?.op === "eq") {
      query = query.eq(filter.column, filter.value);
    }
  }
  return query.maybeSingle();
}

export async function tryProfileSelect(userId, selectors) {
  let lastError = null;
  for (const selector of selectors) {
    const result = await maybeSelectSingle("profiles", selector, [
      { op: "eq", column: "id", value: userId },
    ]);
    if (!result.error) {
      return { data: result.data ?? null, error: null };
    }

    lastError = result.error;
    const message = String(result.error?.message || "").toLowerCase();
    if (!message.includes("column")) {
      return { data: null, error: result.error };
    }
  }
  return { data: null, error: lastError };
}

export function withTimeout(promise, ms, fallbackFactory) {
  return Promise.race([
    promise,
    new Promise((resolve) => {
      setTimeout(() => resolve(fallbackFactory()), ms);
    }),
  ]);
}

export function normalizeRole(value) {
  const role = String(value || "client").trim().toLowerCase();
  if (["admin", "driver", "client"].includes(role)) {
    return role;
  }
  return "client";
}

export function normalizeStatus(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : null;
}

export function deriveDriverApproved(driver) {
  if (!driver) return false;

  if (typeof driver.approved === "boolean") return driver.approved;
  if (typeof driver.is_approved === "boolean") return driver.is_approved;

  const status = normalizeStatus(driver.status);
  if (status) {
    return ["approved", "active", "verified", "enabled", "ok"].includes(status);
  }

  return true;
}
