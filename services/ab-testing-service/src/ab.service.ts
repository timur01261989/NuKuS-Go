import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { v4 as uuid } from "uuid";

const sb = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export interface Experiment {
  id:          string;
  name:        string;
  description: string;
  variants:    Variant[];
  targeting:   TargetingRule;
  status:      "draft" | "running" | "paused" | "completed";
  started_at?: string;
  ended_at?:   string;
  created_at:  string;
}

export interface Variant {
  id:      string;
  name:    string;
  weight:  number;    // 0-100, should sum to 100
  config:  Record<string, any>;
}

export interface TargetingRule {
  user_segments?: string[];  // "new_users", "premium", "all"
  regions?:       string[];
  platforms?:     string[];
  percentage?:    number;    // % of eligible users
}

export interface ExperimentAssignment {
  experiment_id: string;
  user_id:       string;
  variant_id:    string;
  variant_config: Record<string, any>;
  assigned_at:   string;
}

export class ABTestingService {

  async createExperiment(data: Omit<Experiment, "id" | "created_at">): Promise<Experiment> {
    const totalWeight = data.variants.reduce((s, v) => s + v.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) throw new Error("Variant weights must sum to 100");
    const { data: exp, error } = await sb.from("experiments")
      .insert({ id: uuid(), ...data, created_at: new Date().toISOString() })
      .select().single();
    if (error) throw error;
    return exp as Experiment;
  }

  async getVariantForUser(experimentId: string, userId: string): Promise<ExperimentAssignment | null> {
    // Check existing assignment
    const { data: existing } = await sb.from("experiment_assignments")
      .select("*").eq("experiment_id", experimentId).eq("user_id", userId).single();
    if (existing) return existing as ExperimentAssignment;

    // Get experiment
    const { data: exp } = await sb.from("experiments")
      .select("*").eq("id", experimentId).eq("status", "running").single();
    if (!exp) return null;

    const experiment = exp as Experiment;

    // Deterministic bucket assignment (same user always gets same variant)
    const hash      = createHash("sha256").update(`${userId}:${experimentId}`).digest("hex");
    const bucket    = parseInt(hash.slice(0, 8), 16) % 100;
    let cumulative  = 0;
    let assigned:   Variant | null = null;

    for (const variant of experiment.variants) {
      cumulative += variant.weight;
      if (bucket < cumulative) { assigned = variant; break; }
    }
    if (!assigned) assigned = experiment.variants[experiment.variants.length - 1];

    const assignment: Omit<ExperimentAssignment, "assigned_at"> & { assigned_at: string } = {
      experiment_id:   experimentId,
      user_id:         userId,
      variant_id:      assigned.id,
      variant_config:  assigned.config,
      assigned_at:     new Date().toISOString(),
    };

    await sb.from("experiment_assignments").insert(assignment);
    return assignment;
  }

  async trackEvent(
    experimentId: string, userId: string, event: string, value?: number
  ): Promise<void> {
    await sb.from("experiment_events").insert({
      id: uuid(), experiment_id: experimentId, user_id: userId,
      event, value: value || 1, created_at: new Date().toISOString(),
    });
  }

  async getResults(experimentId: string): Promise<any> {
    const { data: assignments } = await sb.from("experiment_assignments")
      .select("variant_id").eq("experiment_id", experimentId);
    const { data: events } = await sb.from("experiment_events")
      .select("variant_id:experiment_assignments!inner(variant_id),event,value")
      .eq("experiment_id", experimentId);

    const variantStats: Record<string, { users: number; conversions: number; total_value: number }> = {};
    (assignments || []).forEach((a: any) => {
      variantStats[a.variant_id] = variantStats[a.variant_id] || { users: 0, conversions: 0, total_value: 0 };
      variantStats[a.variant_id].users++;
    });
    (events || []).forEach((e: any) => {
      const vid = e.variant_id?.variant_id;
      if (vid && variantStats[vid]) {
        variantStats[vid].conversions++;
        variantStats[vid].total_value += e.value || 0;
      }
    });

    return Object.entries(variantStats).map(([vid, stats]) => ({
      variant_id:       vid,
      users:            stats.users,
      conversions:      stats.conversions,
      conversion_rate:  stats.users > 0 ? (stats.conversions / stats.users * 100).toFixed(2) + "%" : "0%",
      avg_value:        stats.users > 0 ? Math.round(stats.total_value / stats.users) : 0,
    }));
  }

  async listRunning(): Promise<Experiment[]> {
    const { data } = await sb.from("experiments").select("*").eq("status", "running");
    return (data || []) as Experiment[];
  }
}
