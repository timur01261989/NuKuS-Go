import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT) || 6379,
  lazyConnect: true,
  maxRetriesPerRequest: 2,
});

export type SagaStatus = "pending" | "running" | "completed" | "compensating" | "failed";

export interface SagaStep<T = any> {
  name:       string;
  execute:    (ctx: T) => Promise<Partial<T>>;
  compensate: (ctx: T) => Promise<void>;
}

export interface SagaState<T = any> {
  id:            string;
  name:          string;
  status:        SagaStatus;
  context:       T;
  current_step:  number;
  completed_steps: string[];
  error?:        string;
  started_at:    string;
  updated_at:    string;
}

export class Saga<T extends object = Record<string, any>> {
  private steps: SagaStep<T>[] = [];

  constructor(private readonly name: string) {}

  addStep(step: SagaStep<T>): this {
    this.steps.push(step);
    return this;
  }

  async execute(initialCtx: T): Promise<{ success: boolean; context: T; error?: string }> {
    const sagaId = `saga:${this.name}:${Date.now()}`;
    let ctx = { ...initialCtx };
    const completedSteps: SagaStep<T>[] = [];

    // Persist initial state
    await this._saveState(sagaId, "running", ctx, 0, []);

    for (const step of this.steps) {
      try {
        console.warn(`[Saga:${this.name}] Running step: ${step.name}`);
        const result = await step.execute(ctx);
        ctx = { ...ctx, ...result };
        completedSteps.push(step);
        await this._saveState(sagaId, "running", ctx, completedSteps.length,
          completedSteps.map(s => s.name));
      } catch (err: any) {
        console.error(`[Saga:${this.name}] Step ${step.name} failed:`, err.message);
        await this._saveState(sagaId, "compensating", ctx, completedSteps.length,
          completedSteps.map(s => s.name), err.message);

        // Compensate in reverse order
        for (const done of [...completedSteps].reverse()) {
          try {
            console.warn(`[Saga:${this.name}] Compensating: ${done.name}`);
            await done.compensate(ctx);
          } catch (compErr: any) {
            console.error(`[Saga:${this.name}] Compensation failed for ${done.name}:`, compErr.message);
          }
        }

        await this._saveState(sagaId, "failed", ctx, completedSteps.length,
          completedSteps.map(s => s.name), err.message);
        return { success: false, context: ctx, error: err.message };
      }
    }

    await this._saveState(sagaId, "completed", ctx,
      this.steps.length, this.steps.map(s => s.name));
    return { success: true, context: ctx };
  }

  private async _saveState(
    id: string, status: SagaStatus, ctx: T,
    step: number, completed: string[], error?: string
  ) {
    const state: SagaState<T> = {
      id, name: this.name, status, context: ctx,
      current_step: step, completed_steps: completed, error,
      started_at:  new Date().toISOString(),
      updated_at:  new Date().toISOString(),
    };
    await redis.setex(id, 3600, JSON.stringify(state));
  }
}

// ── Pre-built Sagas ───────────────────────────────────────────────────────────

export interface RideCompletionCtx {
  order_id:  string;
  driver_id: string;
  client_id: string;
  amount_uzs: number;
  service_type: string;
  ride_service_url:     string;
  payment_service_url:  string;
  earnings_service_url: string;
  wallet_service_url:   string;
  reward_service_url:   string;
}

export function createRideCompletionSaga(): Saga<RideCompletionCtx> {
  return new Saga<RideCompletionCtx>("ride-completion")

    .addStep({
      name: "complete-order",
      async execute(ctx) {
        const res = await fetch(`${ctx.ride_service_url}/ride/${ctx.order_id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "completed" }),
        });
        if (!res.ok) throw new Error("Order completion failed");
        return {};
      },
      async compensate(ctx) {
        await fetch(`${ctx.ride_service_url}/ride/${ctx.order_id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "in_progress" }),
        }).catch(() => null);
      },
    })

    .addStep({
      name: "process-payment",
      async execute(ctx) {
        const res = await fetch(`${ctx.wallet_service_url}/wallet/debit`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: ctx.client_id, amount: ctx.amount_uzs,
            type: "ride_payment", description: "Buyurtma to'lovi",
            order_id: ctx.order_id,
          }),
        });
        if (!res.ok) {
          // Try wallet, fall back to cash
          console.warn("[Saga] Wallet payment failed, falling back to cash");
        }
        return {};
      },
      async compensate(ctx) {
        await fetch(`${ctx.wallet_service_url}/wallet/credit`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: ctx.client_id, amount: ctx.amount_uzs,
            type: "refund", description: "Bekor qilingan buyurtma qaytarma",
            order_id: ctx.order_id,
          }),
        }).catch(() => null);
      },
    })

    .addStep({
      name: "record-driver-earnings",
      async execute(ctx) {
        await fetch(`${ctx.earnings_service_url}/earnings/record`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            driver_id: ctx.driver_id, order_id: ctx.order_id,
            gross_uzs: ctx.amount_uzs, service_type: ctx.service_type,
          }),
        }).catch(() => null);
        return {};
      },
      async compensate(_ctx) {
        // Earnings rollback — complex, log for manual review
        console.warn("[Saga] Earnings compensation needed - manual review");
      },
    })

    .addStep({
      name: "grant-cashback",
      async execute(ctx) {
        const cashback = Math.round(ctx.amount_uzs * 0.03); // 3% cashback
        if (cashback > 0) {
          await fetch(`${ctx.wallet_service_url}/wallet/credit`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: ctx.client_id, amount: cashback,
              type: "cashback", description: "Buyurtmadan 3% cashback",
              order_id: ctx.order_id,
            }),
          }).catch(() => null);
        }
        return {};
      },
      async compensate(_ctx) {
        // Cashback compensation optional
      },
    });
}
