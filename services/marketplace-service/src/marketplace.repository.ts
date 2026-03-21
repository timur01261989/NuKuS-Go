import { createClient } from "@supabase/supabase-js";
import { CarAd } from "./marketplace.types";

const sb = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export class MarketplaceRepository {
  async create(data: Omit<CarAd, "id" | "views" | "created_at">): Promise<CarAd> {
    const { data: ad, error } = await sb
      .from("car_ads")
      .insert({ ...data, views: 0, status: "active", created_at: new Date().toISOString() })
      .select().single();
    if (error) throw error;
    return ad as CarAd;
  }

  async list(filters: Record<string, any> = {}, limit = 20, offset = 0): Promise<{ ads: CarAd[]; total: number }> {
    let q = sb.from("car_ads").select("*", { count: "exact" }).eq("status", "active");
    if (filters.brand)      q = q.eq("brand", filters.brand);
    if (filters.city)       q = q.eq("city", filters.city);
    if (filters.min_price)  q = q.gte("price_usd", filters.min_price);
    if (filters.max_price)  q = q.lte("price_usd", filters.max_price);
    if (filters.min_year)   q = q.gte("year", filters.min_year);
    if (filters.body_type)  q = q.eq("body_type", filters.body_type);
    q = q.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
    const { data, count } = await q;
    return { ads: (data || []) as CarAd[], total: count || 0 };
  }

  async findById(id: string): Promise<CarAd | null> {
    const { data } = await sb.from("car_ads").select("*").eq("id", id).single();
    if (data) await sb.from("car_ads").update({ views: (data.views || 0) + 1 }).eq("id", id);
    return data as CarAd | null;
  }

  async myAds(sellerId: string): Promise<CarAd[]> {
    const { data } = await sb.from("car_ads").select("*").eq("seller_id", sellerId).order("created_at", { ascending: false });
    return (data || []) as CarAd[];
  }

  async markSold(id: string): Promise<CarAd> {
    const { data, error } = await sb.from("car_ads").update({ status: "sold", updated_at: new Date().toISOString() }).eq("id", id).select().single();
    if (error) throw error;
    return data as CarAd;
  }

  async delete(id: string, sellerId: string): Promise<void> {
    await sb.from("car_ads").update({ status: "deleted" }).eq("id", id).eq("seller_id", sellerId);
  }
}
