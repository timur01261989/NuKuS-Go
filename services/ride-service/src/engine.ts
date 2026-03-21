import { createClient } from "@supabase/supabase-js";
import { RideOrder, RideStatus } from "./ride";

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export class RideEngine {
  async createOrder(data: Omit<RideOrder, "id" | "status" | "created_at">) {
    const { data: order, error } = await supabase
      .from("orders")
      .insert({ ...data, status: "searching", created_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return order as RideOrder;
  }

  async updateStatus(orderId: string, status: RideStatus, driverId?: string) {
    const update: any = { status, updated_at: new Date().toISOString() };
    if (driverId) update.driver_id = driverId;
    const { data, error } = await supabase.from("orders").update(update).eq("id", orderId).select().single();
    if (error) throw error;
    return data as RideOrder;
  }

  async getOrder(orderId: string) {
    const { data, error } = await supabase.from("orders").select("*").eq("id", orderId).single();
    if (error) throw error;
    return data as RideOrder;
  }

  async getActiveOrdersForClient(clientId: string) {
    const { data } = await supabase.from("orders").select("*").eq("client_id", clientId).not("status", "in", '("completed","cancelled")');
    return (data || []) as RideOrder[];
  }
}
