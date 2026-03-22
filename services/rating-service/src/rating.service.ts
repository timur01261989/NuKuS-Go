import { createClient } from "@supabase/supabase-js";
import { v4 as uuid } from "uuid";

const sb = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export interface Rating {
  id:          string;
  order_id:    string;
  from_id:     string;
  to_id:       string;
  from_role:   "client" | "driver";
  stars:       1 | 2 | 3 | 4 | 5;
  categories:  Record<string, number>;
  comment?:    string;
  tags:        string[];
  is_anonymous:boolean;
  disputed:    boolean;
  created_at:  string;
}

export interface DriverRatingStats {
  driver_id:          string;
  avg_rating:         number;
  total_ratings:      number;
  distribution:       Record<string, number>;
  avg_by_category:    Record<string, number>;
  trending:           "up" | "down" | "stable";
  compliment_tags:    string[];
}

const DRIVER_CATEGORIES = ["navigation", "politeness", "cleanliness", "on_time"];
const CLIENT_CATEGORIES = ["politeness", "punctuality", "address_accuracy"];

const POSITIVE_TAGS  = ["Tez yetdi","Xushmuomala","Toza avto","Yo'lni yaxshi biladi","Suhbatdosh","Xavfsiz haydadi"];
const NEGATIVE_TAGS  = ["Kech qoldi","Yo'lni bilmaydi","Avtomobil iflos","Badaxloq","Xavfli haydadi"];

export class RatingService {

  async submitRating(
    orderId:     string,
    fromId:      string,
    toId:        string,
    fromRole:    "client" | "driver",
    stars:       number,
    categories:  Record<string, number>,
    comment?:    string,
    tags:        string[] = [],
    isAnonymous  = false
  ): Promise<Rating> {
    // Prevent duplicate rating
    const { data: existing } = await sb.from("ratings")
      .select("id").eq("order_id", orderId).eq("from_id", fromId).single();
    if (existing) throw new Error("Bu buyurtma uchun allaqachon baho berdingiz");

    const { data, error } = await sb.from("ratings").insert({
      id: uuid(), order_id: orderId, from_id: fromId, to_id: toId,
      from_role: fromRole, stars, categories,
      comment, tags, is_anonymous: isAnonymous,
      disputed: false, created_at: new Date().toISOString(),
    }).select().single();
    if (error) throw error;

    // Update aggregate rating
    await this._updateAggregateRating(toId, fromRole === "client" ? "driver" : "client");

    return data as Rating;
  }

  async disputeRating(ratingId: string, reason: string, disputerId: string): Promise<void> {
    const { data: rating } = await sb.from("ratings").select("*").eq("id", ratingId).single();
    if (!rating) throw new Error("Reyting topilmadi");
    if ((rating as any).to_id !== disputerId) throw new Error("Ruxsat yo'q");

    await sb.from("ratings").update({ disputed: true }).eq("id", ratingId);
    await sb.from("rating_disputes").insert({
      id: uuid(), rating_id: ratingId, disputer_id: disputerId,
      reason, status: "pending", created_at: new Date().toISOString(),
    });
  }

  async resolveDispute(
    disputeId: string, decision: "uphold" | "remove", adminId: string
  ): Promise<void> {
    const { data: dispute } = await sb.from("rating_disputes")
      .select("rating_id").eq("id", disputeId).single();
    if (!dispute) throw new Error("Dispute topilmadi");

    await sb.from("rating_disputes").update({
      status: "resolved", resolved_by: adminId,
      decision, resolved_at: new Date().toISOString(),
    }).eq("id", disputeId);

    if (decision === "remove") {
      await sb.from("ratings").update({ is_visible: false }).eq("id", (dispute as any).rating_id);
      const { data: r } = await sb.from("ratings").select("to_id, from_role").eq("id", (dispute as any).rating_id).single();
      if (r) await this._updateAggregateRating((r as any).to_id, (r as any).from_role === "client" ? "driver" : "client");
    }
  }

  async getDriverStats(driverId: string): Promise<DriverRatingStats> {
    const { data: ratings } = await sb.from("ratings")
      .select("stars, categories, tags")
      .eq("to_id", driverId)
      .eq("from_role", "client")
      .eq("is_visible", true)
      .order("created_at", { ascending: false })
      .limit(500);

    const rs = (ratings || []) as any[];
    if (!rs.length) return {
      driver_id: driverId, avg_rating: 5.0, total_ratings: 0,
      distribution: {}, avg_by_category: {}, trending: "stable", compliment_tags: [],
    };

    const dist: Record<string, number> = { "1":0,"2":0,"3":0,"4":0,"5":0 };
    let totalStars = 0;
    const catSums: Record<string, number[]> = {};
    const tagCount: Record<string, number>  = {};

    for (const r of rs) {
      dist[String(r.stars)] = (dist[String(r.stars)] || 0) + 1;
      totalStars += r.stars;
      for (const [cat, val] of Object.entries(r.categories || {})) {
        catSums[cat] = catSums[cat] || [];
        catSums[cat].push(val as number);
      }
      for (const tag of (r.tags || [])) {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      }
    }

    const avg = totalStars / rs.length;
    const recent = rs.slice(0, 20);
    const older  = rs.slice(20, 60);
    const recentAvg = recent.reduce((s: number, r: any) => s + r.stars, 0) / (recent.length || 1);
    const olderAvg  = older.reduce((s:  number, r: any) => s + r.stars, 0) / (older.length  || 1);
    const trending  = recentAvg > olderAvg + 0.2 ? "up" : recentAvg < olderAvg - 0.2 ? "down" : "stable";

    const avgByCategory: Record<string, number> = {};
    for (const [cat, vals] of Object.entries(catSums)) {
      avgByCategory[cat] = vals.reduce((s, v) => s + v, 0) / vals.length;
    }

    const topTags = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tag]) => tag);

    return {
      driver_id:       driverId,
      avg_rating:      Math.round(avg * 100) / 100,
      total_ratings:   rs.length,
      distribution:    dist,
      avg_by_category: avgByCategory,
      trending,
      compliment_tags: topTags,
    };
  }

  private async _updateAggregateRating(userId: string, role: "driver" | "client"): Promise<void> {
    const { data } = await sb.from("ratings")
      .select("stars").eq("to_id", userId).eq("is_visible", true);
    if (!data?.length) return;
    const avg = data.reduce((s: number, r: any) => s + r.stars, 0) / data.length;
    if (role === "driver") {
      await sb.from("drivers").update({ rating: Math.round(avg * 100) / 100 }).eq("user_id", userId);
    }
  }

  getTagSuggestions(role: "client" | "driver", isPositive: boolean): string[] {
    const tags = isPositive ? POSITIVE_TAGS : NEGATIVE_TAGS;
    return tags;
  }
}
