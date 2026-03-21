import { createClient } from "@supabase/supabase-js";
import { CargoOrder, FreightStatus } from "./freight.types";

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export class FreightRepository {
  async create(data: Omit<CargoOrder, "id" | "status" | "created_at">): Promise<CargoOrder> {
    const { data: order, error } = await supabase
      .from("cargo_orders")
      .insert({ ...data, status: "searching", created_at: new Date().toISOString() })
      .select().single();
    if (error) throw error;
    return order as CargoOrder;
  }

  async findById(id: string): Promise<CargoOrder | null> {
    const { data } = await supabase.from("cargo_orders").select("*").eq("id", id).single();
    return data as CargoOrder | null;
  }

  async updateStatus(id: string, status: FreightStatus, driverId?: string): Promise<CargoOrder> {
    const patch: any = { status, updated_at: new Date().toISOString() };
    if (driverId) patch.driver_id = driverId;
    const { data, error } = await supabase.from("cargo_orders").update(patch).eq("id", id).select().single();
    if (error) throw error;
    return data as CargoOrder;
  }

  async listByUser(userId: string): Promise<CargoOrder[]> {
    const { data } = await supabase
      .from("cargo_orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    return (data || []) as CargoOrder[];
  }

  async matchVehicles(cargoId: string, radiusKm = 30): Promise<any[]> {
    // Get cargo location, find nearby freight drivers via location-service
    const cargo = await this.findById(cargoId);
    if (!cargo) return [];
    const res = await fetch(
      `${process.env.LOCATION_SERVICE_URL || "http://location-service:3005"}/location/nearby?lat=${cargo.pickup.lat}&lng=${cargo.pickup.lng}&radius_km=${radiusKm}`
    ).catch(() => null);
    if (!res?.ok) return [];
    const json = await res.json();
    return json.drivers || [];
  }
}
