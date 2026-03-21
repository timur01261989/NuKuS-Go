import { createClient } from "@supabase/supabase-js";
import { Campaign, PromoUsage, DiscountType } from "./promo.types";
import { v4 as uuid } from "uuid";

const sb = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export class PromoService {

  async createCampaign(data: Omit<Campaign, "id" | "spent_uzs" | "used_count" | "created_at">): Promise<Campaign> {
    const { data: campaign, error } = await sb.from("promo_campaigns")
      .insert({ ...data, spent_uzs: 0, used_count: 0, created_at: new Date().toISOString() })
      .select().single();
    if (error) throw error;
    return campaign as Campaign;
  }

  async validatePromoCode(
    code:        string,
    userId:      string,
    orderAmount: number,
    serviceType: string
  ): Promise<{ valid: boolean; campaign?: Campaign; discount_uzs?: number; reason?: string }> {
    const { data: campaign } = await sb.from("promo_campaigns")
      .select("*").eq("promo_code", code).eq("is_active", true)
      .gt("ends_at", new Date().toISOString()).single();

    if (!campaign) return { valid: false, reason: "Promo kod topilmadi yoki muddati o'tgan" };
    const c = campaign as Campaign;

    // Budget check
    if (c.spent_uzs >= c.budget_uzs) return { valid: false, reason: "Promo byudjet tugagan" };

    // Usage limit
    if (c.used_count >= c.usage_limit) return { valid: false, reason: "Promo limitdan foydalanildi" };

    // Service check
    if (c.applicable_services.length && !c.applicable_services.includes(serviceType))
      return { valid: false, reason: "Bu xizmat uchun promo ishlamaydi" };

    // Minimum order
    if (orderAmount < c.min_order_uzs)
      return { valid: false, reason: `Minimal buyurtma: ${c.min_order_uzs.toLocaleString("ru")} so'm` };

    // Per-user limit
    const { count } = await sb.from("promo_usages")
      .select("id", { count: "exact" })
      .eq("campaign_id", c.id).eq("user_id", userId);
    if ((count || 0) >= c.usage_per_user)
      return { valid: false, reason: "Siz bu promoni allaqachon ishlatgansiz" };

    // Audience targeting
    if (c.target_audience !== "all") {
      const isValid = await this.checkAudience(userId, c.target_audience);
      if (!isValid) return { valid: false, reason: "Siz bu promo uchun muvofiq emassiz" };
    }

    const discount = this.calculateDiscount(c, orderAmount);
    return { valid: true, campaign: c, discount_uzs: discount };
  }

  private calculateDiscount(campaign: Campaign, amount: number): number {
    switch (campaign.discount_type) {
      case "percentage":
        return Math.min(Math.round(amount * campaign.discount_value / 100), campaign.max_discount_uzs);
      case "fixed":
        return Math.min(campaign.discount_value, amount);
      case "free_ride":
        return amount;
      case "cashback":
        return Math.min(Math.round(amount * campaign.discount_value / 100), campaign.max_discount_uzs);
      default:
        return 0;
    }
  }

  private async checkAudience(userId: string, audience: string): Promise<boolean> {
    if (audience === "new_users") {
      const { count } = await sb.from("orders").select("id", { count: "exact" }).eq("client_id", userId);
      return (count || 0) === 0;
    }
    if (audience === "inactive_30d") {
      const date30 = new Date(Date.now() - 30 * 86400000).toISOString();
      const { count } = await sb.from("orders").select("id", { count: "exact" })
        .eq("client_id", userId).gt("created_at", date30);
      return (count || 0) === 0;
    }
    return true;
  }

  async applyPromo(
    campaignId: string, userId: string, orderId: string, discountUzs: number
  ): Promise<PromoUsage> {
    const cashbackUzs = discountUzs * 0.1; // 10% extra cashback on promo orders
    const { data: usage, error } = await sb.from("promo_usages").insert({
      id: uuid(), campaign_id: campaignId, user_id: userId, order_id: orderId,
      discount_uzs: discountUzs, cashback_uzs: cashbackUzs, used_at: new Date().toISOString(),
    }).select().single();
    if (error) throw error;

    // Update campaign stats
    await sb.from("promo_campaigns").update({
      used_count: sb.rpc("increment_field", { id: campaignId, field: "used_count" }),
      spent_uzs:  sb.rpc("increment_field_by", { id: campaignId, field: "spent_uzs", value: discountUzs }),
    }).eq("id", campaignId);

    return usage as PromoUsage;
  }

  async getActiveCampaigns(serviceType?: string): Promise<Campaign[]> {
    let q = sb.from("promo_campaigns").select("*").eq("is_active", true)
      .gt("ends_at", new Date().toISOString())
      .order("created_at", { ascending: false });
    const { data } = await q;
    return (data || []).filter((c: any) =>
      !serviceType || !c.applicable_services.length || c.applicable_services.includes(serviceType)
    ) as Campaign[];
  }

  async getCampaignStats(campaignId: string) {
    const [campaign, usages] = await Promise.all([
      sb.from("promo_campaigns").select("*").eq("id", campaignId).single(),
      sb.from("promo_usages").select("discount_uzs, cashback_uzs, used_at").eq("campaign_id", campaignId),
    ]);
    return {
      campaign: campaign.data,
      total_uses:         (usages.data || []).length,
      total_discount_uzs: (usages.data || []).reduce((s: number, u: any) => s + u.discount_uzs, 0),
      total_cashback_uzs: (usages.data || []).reduce((s: number, u: any) => s + u.cashback_uzs, 0),
    };
  }
}
