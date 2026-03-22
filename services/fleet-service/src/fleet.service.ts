import { createClient } from "@supabase/supabase-js";
import { v4 as uuid } from "uuid";

const sb = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export interface Vehicle {
  id:            string;
  driver_id:     string;
  brand:         string;
  model:         string;
  year:          number;
  plate_number:  string;
  color:         string;
  body_type:     string;
  fuel_type:     string;
  seat_count:    number;
  is_active:     boolean;
  is_verified:   boolean;
  mileage_km:    number;
  insurance_exp: string;
  tech_check_exp:string;
  photos:        string[];
  created_at:    string;
}

export interface VehicleInspection {
  id:          string;
  vehicle_id:  string;
  type:        "routine" | "incident" | "annual";
  items: {
    brakes:       boolean;
    tires:        boolean;
    lights:       boolean;
    seatbelts:    boolean;
    airbags:      boolean;
    ac:           boolean;
    cleanliness:  boolean;
    exterior:     boolean;
    fire_extinguisher: boolean;
  };
  passed:       boolean;
  mileage_km:   number;
  notes?:       string;
  inspected_at: string;
  expires_at:   string;
}

export class FleetService {

  async registerVehicle(data: Omit<Vehicle, "id" | "is_verified" | "created_at">): Promise<Vehicle> {
    const { data: v, error } = await sb.from("fleet_vehicles").insert({
      id: uuid(), ...data, is_verified: false,
      created_at: new Date().toISOString(),
    }).select().single();
    if (error) throw error;
    return v as Vehicle;
  }

  async getDriverVehicles(driverId: string): Promise<Vehicle[]> {
    const { data } = await sb.from("fleet_vehicles")
      .select("*").eq("driver_id", driverId).eq("is_active", true);
    return (data || []) as Vehicle[];
  }

  async updateMileage(vehicleId: string, mileageKm: number): Promise<void> {
    await sb.from("fleet_vehicles")
      .update({ mileage_km: mileageKm }).eq("id", vehicleId);
  }

  async submitInspection(
    vehicleId:  string,
    type:       VehicleInspection["type"],
    items:      VehicleInspection["items"],
    mileageKm:  number,
    notes?:     string
  ): Promise<VehicleInspection> {
    const passed     = Object.values(items).every(Boolean);
    const expiresAt  = new Date(Date.now() + 180 * 86400000).toISOString();
    const { data, error } = await sb.from("vehicle_inspections").insert({
      id: uuid(), vehicle_id: vehicleId, type, items,
      passed, mileage_km: mileageKm, notes,
      inspected_at: new Date().toISOString(), expires_at: expiresAt,
    }).select().single();
    if (error) throw error;
    if (passed) {
      await sb.from("fleet_vehicles")
        .update({ is_verified: true, tech_check_exp: expiresAt }).eq("id", vehicleId);
    }
    return data as VehicleInspection;
  }

  async checkExpiring(daysAhead = 30): Promise<Vehicle[]> {
    const threshold = new Date(Date.now() + daysAhead * 86400000).toISOString();
    const { data } = await sb.from("fleet_vehicles")
      .select("*").eq("is_active", true)
      .or(`insurance_exp.lt.${threshold},tech_check_exp.lt.${threshold}`);
    return (data || []) as Vehicle[];
  }

  async verifyVehicle(vehicleId: string, adminId: string): Promise<void> {
    await sb.from("fleet_vehicles")
      .update({ is_verified: true }).eq("id", vehicleId);
  }

  async getFleetStats() {
    const [total, verified, active, expiring] = await Promise.all([
      sb.from("fleet_vehicles").select("id", { count: "exact", head: true }),
      sb.from("fleet_vehicles").select("id", { count: "exact", head: true }).eq("is_verified", true),
      sb.from("fleet_vehicles").select("id", { count: "exact", head: true }).eq("is_active", true),
      this.checkExpiring(14),
    ]);
    return {
      total:    total.count || 0,
      verified: verified.count || 0,
      active:   active.count || 0,
      expiring_soon: expiring.length,
    };
  }
}
