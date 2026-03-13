import * as ordersApi from "@/services/ordersApi";
import * as ordersRealtime from "@/services/ordersRealtime";

const FALLBACK_TABLE = "orders";

const safePromise = async (factory, fallback) => {
  try {
    return await factory();
  } catch {
    return fallback;
  }
};

export async function createOrder(payload) {
  if (typeof ordersApi.createOrder === "function") {
    return ordersApi.createOrder(payload);
  }
  if (typeof ordersApi.insertOrder === "function") {
    return ordersApi.insertOrder(payload);
  }
  throw new Error("clientOrderService.createOrder is not available");
}

export async function getOrderById(orderId) {
  if (!orderId) return null;
  if (typeof ordersApi.getOrderById === "function") {
    return ordersApi.getOrderById(orderId);
  }
  if (typeof ordersApi.fetchOrderById === "function") {
    return ordersApi.fetchOrderById(orderId);
  }
  return null;
}

export async function listOrders(params = {}) {
  if (typeof ordersApi.listOrders === "function") {
    return ordersApi.listOrders(params);
  }
  if (typeof ordersApi.getOrders === "function") {
    return ordersApi.getOrders(params);
  }

  const { userId, limit = 50, status } = params;
  const supabase = await safePromise(() => import("@/services/supabase/supabaseClient.js"), null);
  const client = supabase?.supabase || supabase?.default || supabase?.client || null;

  if (!client || typeof client.from !== "function") {
    return [];
  }

  let query = client
    .from(FALLBACK_TABLE)
    .select("id,user_id,driver_id,service_type,status,pickup_address,dropoff_address,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (userId) query = query.eq("user_id", userId);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export function subscribeOrder(orderId, onChange) {
  if (!orderId || typeof onChange !== "function") {
    return () => {};
  }

  if (typeof ordersRealtime.subscribeOrder === "function") {
    return ordersRealtime.subscribeOrder(orderId, onChange);
  }

  if (typeof ordersRealtime.subscribeToOrder === "function") {
    return ordersRealtime.subscribeToOrder(orderId, onChange);
  }

  return () => {};
}

export function subscribeOrders(params = {}, onChange) {
  if (typeof onChange !== "function") {
    return () => {};
  }

  if (typeof ordersRealtime.subscribeOrders === "function") {
    return ordersRealtime.subscribeOrders(params, onChange);
  }

  if (typeof ordersRealtime.subscribeToOrders === "function") {
    return ordersRealtime.subscribeToOrders(params, onChange);
  }

  return () => {};
}

const clientOrderService = {
  createOrder,
  getOrderById,
  listOrders,
  subscribeOrder,
  subscribeOrders,
};

export default clientOrderService;
