import { createClient } from "@supabase/supabase-js";
import { Plan, PlanId, UserSubscription, BillingCycle } from "./subscription.types";
import { PLANS } from "./plans.data";
import { v4 as uuid } from "uuid";

const sb = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export class SubscriptionService {

  getPlans(): Plan[] {
    return Object.values(PLANS);
  }

  getPlan(planId: PlanId): Plan {
    const plan = PLANS[planId];
    if (!plan) throw new Error(`Plan ${planId} topilmadi`);
    return plan;
  }

  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    const { data } = await sb.from("user_subscriptions")
      .select("*").eq("user_id", userId)
      .in("status", ["active", "trial"])
      .gt("expires_at", new Date().toISOString())
      .single();
    return data as UserSubscription | null;
  }

  async subscribe(
    userId:    string,
    planId:    PlanId,
    billing:   BillingCycle,
    paymentMethodId?: string
  ): Promise<UserSubscription> {
    const plan     = this.getPlan(planId);
    const price    = billing === "yearly" ? plan.price_yearly : plan.price_monthly;
    const now      = new Date();
    const expiresAt = new Date(billing === "yearly"
      ? now.getTime() + 365 * 86400000
      : now.getTime() + 30  * 86400000
    ).toISOString();

    // Cancel existing
    await sb.from("user_subscriptions")
      .update({ status: "cancelled" })
      .eq("user_id", userId)
      .eq("status", "active");

    const { data: sub, error } = await sb.from("user_subscriptions").insert({
      id: uuid(), user_id: userId, plan_id: planId,
      billing_cycle: billing, status: "active",
      starts_at: now.toISOString(), expires_at: expiresAt,
      auto_renew: true, payment_method_id: paymentMethodId,
      family_member_ids: [], created_at: now.toISOString(),
    }).select().single();
    if (error) throw error;

    // Log payment
    if (price > 0) {
      await sb.from("subscription_payments").insert({
        user_id: userId, plan_id: planId, amount_uzs: price,
        billing_cycle: billing, created_at: now.toISOString(),
      });
    }

    return sub as UserSubscription;
  }

  async startTrial(userId: string, planId: PlanId = "plus"): Promise<UserSubscription> {
    const existing = await this.getUserSubscription(userId);
    if (existing) throw new Error("Siz allaqachon obunaga egasiz");

    // Check if already used trial
    const { data: trialUsed } = await sb.from("user_subscriptions")
      .select("id").eq("user_id", userId).eq("status", "trial").single();
    if (trialUsed) throw new Error("Sinov muddati allaqachon ishlatilgan");

    const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
    const { data: sub, error } = await sb.from("user_subscriptions").insert({
      id: uuid(), user_id: userId, plan_id: planId,
      billing_cycle: "monthly", status: "trial",
      starts_at: new Date().toISOString(), expires_at: expiresAt,
      auto_renew: false, family_member_ids: [], created_at: new Date().toISOString(),
    }).select().single();
    if (error) throw error;
    return sub as UserSubscription;
  }

  async cancel(userId: string): Promise<void> {
    await sb.from("user_subscriptions")
      .update({ status: "cancelled", auto_renew: false })
      .eq("user_id", userId).eq("status", "active");
  }

  async applyDiscount(userId: string, basePrice: number, serviceType: string): Promise<{
    final_price: number;
    discount_pct: number;
    cashback: number;
    benefit_applied: string;
  }> {
    const sub = await this.getUserSubscription(userId);
    if (!sub) return { final_price: basePrice, discount_pct: 0, cashback: 0, benefit_applied: "none" };

    const plan     = this.getPlan(sub.plan_id);
    const benefits = plan.benefits;

    let discountPct = benefits.ride_discount_pct;
    if (serviceType === "food") discountPct = Math.max(discountPct, benefits.food_discount_pct);

    const discountedPrice = Math.round(basePrice * (1 - discountPct / 100));
    const cashback        = Math.round(discountedPrice * benefits.cashback_pct / 100);

    return {
      final_price:     discountedPrice,
      discount_pct:    discountPct,
      cashback,
      benefit_applied: sub.plan_id,
    };
  }

  async addFamilyMember(userId: string, memberId: string): Promise<void> {
    const sub = await this.getUserSubscription(userId);
    if (!sub) throw new Error("Faol obuna topilmadi");
    const plan = this.getPlan(sub.plan_id);
    if (sub.family_member_ids.length >= plan.benefits.family_members)
      throw new Error(`Bu obunada ${plan.benefits.family_members} nafar oila a'zosi qo'shish mumkin`);
    const updated = [...sub.family_member_ids, memberId];
    await sb.from("user_subscriptions").update({ family_member_ids: updated }).eq("id", sub.id);
  }
}
