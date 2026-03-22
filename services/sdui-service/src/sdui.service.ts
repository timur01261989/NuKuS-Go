import { createClient } from "@supabase/supabase-js";
import { SDUIScreen, SDUIComponent, TargetingRule } from "./sdui.types";
import { v4 as uuid } from "uuid";

const sb = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// ── Built-in component templates ─────────────────────────────────────────────
const BUILTIN_COMPONENTS = {

  surgeBanner: (factor: number): SDUIComponent => ({
    id:       "surge-banner",
    type:     "surge_indicator",
    visible:  factor > 1.2,
    priority: 100,
    targeting: { conditions: ["surge_active"] },
    layout:   { position: "top", theme: "warning", style: { height: 44 } },
    data: {
      surge_factor: factor,
      title_uz:    `Narx x${factor} — talab yuqori`,
      title_ru:    `Цена x${factor} — высокий спрос`,
      subtitle_uz: "Keyinroq urinib ko'ring",
      subtitle_ru: "Попробуйте позже",
      icon:        "⚡",
    },
    actions: [{ trigger: "tap", type: "dismiss", payload: {} }],
  }),

  emergencyBanner: (message: string): SDUIComponent => ({
    id:       "emergency-" + Date.now(),
    type:     "emergency_alert",
    visible:  true,
    priority: 1000,  // Always on top
    targeting: {},
    layout:   { position: "top", theme: "error", style: { height: 56 } },
    data:     { message_uz: message, message_ru: message, dismissable: false },
    actions:  [],
  }),

  holidayPromo: (title: string, discount: number): SDUIComponent => ({
    id:       `promo-${uuid()}`,
    type:     "promo_banner",
    visible:  true,
    priority: 80,
    targeting: {},
    layout:   { position: "inline", theme: "success", style: { borderRadius: 12 } },
    data: {
      title_uz:   title,
      discount_pct: discount,
      cta_uz:     "Hozir buyurtma bering",
      cta_ru:     "Заказать сейчас",
      image_url:  null,
    },
    actions: [{
      trigger: "tap", type: "navigate",
      payload: { screen: "home", promo_applied: true },
    }],
  }),
};

export class SDUIService {

  async getScreen(
    screenId:   string,
    userId:     string,
    region:     string,
    lang:       string,
    appVersion: string,
    role:       string
  ): Promise<SDUIScreen> {

    // 1. Get stored components for this screen
    const { data: storedComps } = await sb.from("sdui_components")
      .select("*")
      .eq("screen_id", screenId)
      .eq("active", true)
      .gt("expires_at", new Date().toISOString())
      .order("priority", { ascending: false });

    // 2. Filter by targeting rules
    const matched = ((storedComps || []) as any[]).filter(comp => {
      const rules: TargetingRule = comp.targeting || {};
      if (rules.regions?.length  && !rules.regions.includes(region))   return false;
      if (rules.user_roles?.length && !rules.user_roles.includes(role)) return false;
      if (rules.languages?.length && !rules.languages.includes(lang))  return false;
      if (rules.user_ids?.length  && !rules.user_ids.includes(userId)) return false;
      return true;
    });

    // 3. Add dynamic components
    const dynamic: SDUIComponent[] = [];

    if (screenId === "home") {
      // Surge check
      const surgeKey = `surge_home:${region}`;
      const surgeFactor = 1.8; // In production: fetch from Redis/ML service
      if (surgeFactor > 1.2) {
        dynamic.push(BUILTIN_COMPONENTS.surgeBanner(surgeFactor));
      }
    }

    return {
      screen_id:        screenId,
      version:          Date.now(),
      components:       [...dynamic, ...matched].sort((a, b) => (b.priority || 0) - (a.priority || 0)),
      refresh_after_ms: 30_000,
      cached_for_ms:    10_000,
    };
  }

  async createComponent(data: Partial<SDUIComponent> & {
    screen_id: string; active?: boolean; expires_at?: string;
  }): Promise<any> {
    const { data: comp, error } = await sb.from("sdui_components").insert({
      id:         uuid(),
      screen_id:  data.screen_id,
      type:       data.type || "card",
      visible:    data.visible ?? true,
      priority:   data.priority || 50,
      targeting:  data.targeting || {},
      layout:     data.layout || { position: "inline", theme: "light", style: {} },
      data:       data.data || {},
      actions:    data.actions || [],
      active:     data.active ?? true,
      expires_at: data.expires_at || new Date(Date.now() + 30 * 86400000).toISOString(),
      created_at: new Date().toISOString(),
    }).select().single();
    if (error) throw error;
    return comp;
  }

  async broadcastAlert(message: string, targetRegions?: string[]): Promise<void> {
    const comp = BUILTIN_COMPONENTS.emergencyBanner(message);
    await sb.from("sdui_components").insert({
      ...comp,
      screen_id:  "all",
      active:     true,
      targeting:  targetRegions ? { regions: targetRegions } : {},
      expires_at: new Date(Date.now() + 4 * 3600000).toISOString(), // 4 hours
      created_at: new Date().toISOString(),
    });
    console.warn(`[sdui] Emergency broadcast: ${message} → ${targetRegions?.join(", ") || "ALL"}`);
  }

  async deactivateComponent(id: string): Promise<void> {
    await sb.from("sdui_components").update({ active: false }).eq("id", id);
  }

  async listComponents(screenId?: string): Promise<any[]> {
    let q = sb.from("sdui_components").select("*").eq("active", true);
    if (screenId) q = q.eq("screen_id", screenId);
    const { data } = await q.order("priority", { ascending: false });
    return data || [];
  }
}
