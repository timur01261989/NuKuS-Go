import { createClient } from "@supabase/supabase-js";
import { DeliveryOrder, DeliveryStatus } from "./delivery.types";

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export class DeliveryRepository {
  async create(data: Omit<DeliveryOrder, "id" | "status" | "created_at">): Promise<DeliveryOrder> {
    const pin = String(Math.floor(1000 + Math.random() * 9000));
    const { data: order, error } = await supabase
      .from("delivery_orders")
      .insert({ ...data, status: "searching", pin_code: pin, created_at: new Date().toISOString() })
      .select().single();
    if (error) throw error;
    return order as DeliveryOrder;
  }

  async findById(id: string): Promise<DeliveryOrder | null> {
    const { data } = await supabase.from("delivery_orders").select("*").eq("id", id).single();
    return data as DeliveryOrder | null;
  }

  async findActiveByUser(userId: string): Promise<DeliveryOrder[]> {
    const { data } = await supabase
      .from("delivery_orders")
      .select("*")
      .eq("user_id", userId)
      .not("status", "in", "(delivered,canceled)")
      .order("created_at", { ascending: false });
    return (data || []) as DeliveryOrder[];
  }

  async updateStatus(id: string, status: DeliveryStatus, driverId?: string): Promise<DeliveryOrder> {
    const patch: any = { status, updated_at: new Date().toISOString() };
    if (driverId) patch.driver_id = driverId;
    const { data, error } = await supabase.from("delivery_orders").update(patch).eq("id", id).select().single();
    if (error) throw error;
    return data as DeliveryOrder;
  }

  async cancel(id: string, reason?: string): Promise<DeliveryOrder> {
    const { data, error } = await supabase
      .from("delivery_orders")
      .update({ status: "canceled", cancel_reason: reason, updated_at: new Date().toISOString() })
      .eq("id", id).select().single();
    if (error) throw error;
    return data as DeliveryOrder;
  }
}
