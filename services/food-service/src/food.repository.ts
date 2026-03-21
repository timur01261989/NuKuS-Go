import { createClient } from "@supabase/supabase-js";
import { Restaurant, MenuItem, FoodOrder, OrderStatus } from "./food.types";

const sb = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export class FoodRepository {
  async listRestaurants(city?: string): Promise<Restaurant[]> {
    let q = sb.from("restaurants").select("*").eq("is_open", true);
    if (city) q = q.eq("city", city);
    const { data } = await q.order("rating", { ascending: false });
    return (data || []) as Restaurant[];
  }

  async getMenu(restaurantId: string): Promise<MenuItem[]> {
    const { data } = await sb.from("menu_items")
      .select("*").eq("restaurant_id", restaurantId).eq("is_available", true);
    return (data || []) as MenuItem[];
  }

  async createOrder(data: Omit<FoodOrder, "id" | "status" | "created_at">): Promise<FoodOrder> {
    const { data: order, error } = await sb.from("food_orders")
      .insert({ ...data, status: "pending", created_at: new Date().toISOString() })
      .select().single();
    if (error) throw error;
    return order as FoodOrder;
  }

  async updateStatus(id: string, status: OrderStatus, courierId?: string): Promise<FoodOrder> {
    const patch: any = { status, updated_at: new Date().toISOString() };
    if (courierId) patch.courier_id = courierId;
    const { data, error } = await sb.from("food_orders").update(patch).eq("id", id).select().single();
    if (error) throw error;
    return data as FoodOrder;
  }

  async myOrders(userId: string): Promise<FoodOrder[]> {
    const { data } = await sb.from("food_orders")
      .select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(30);
    return (data || []) as FoodOrder[];
  }
}
