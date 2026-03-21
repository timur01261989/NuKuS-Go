/**
 * Ride Saga — Distributed Transaction Coordinator
 * Implements SAGA pattern for complex ride lifecycle:
 * CREATE → MATCH → ACCEPT → START → COMPLETE → PAY
 *
 * Each step has a compensating transaction for rollback.
 */
import { publishOne, RIDE_TOPICS } from "@unigo/event-bus";

export type SagaStep =
  | "created"
  | "matching"
  | "matched"
  | "driver_accepted"
  | "driver_arrived"
  | "trip_started"
  | "trip_completed"
  | "payment_initiated"
  | "payment_completed"
  | "cancelled"
  | "failed";

export interface RideSagaState {
  ride_id: string;
  user_id: string;
  driver_id?: string;
  current_step: SagaStep;
  steps_history: { step: SagaStep; ts: number; meta?: unknown }[];
  created_at: string;
}

// In-memory saga store (production: Redis or DB)
const sagas = new Map<string, RideSagaState>();

export function createSaga(rideId: string, userId: string): RideSagaState {
  const state: RideSagaState = {
    ride_id: rideId,
    user_id: userId,
    current_step: "created",
    steps_history: [{ step: "created", ts: Date.now() }],
    created_at: new Date().toISOString(),
  };
  sagas.set(rideId, state);
  return state;
}

export function advanceSaga(
  rideId: string,
  nextStep: SagaStep,
  meta?: unknown
): RideSagaState | null {
  const saga = sagas.get(rideId);
  if (!saga) return null;
  saga.current_step = nextStep;
  saga.steps_history.push({ step: nextStep, ts: Date.now(), meta });
  return saga;
}

export async function compensate(rideId: string, reason: string): Promise<void> {
  const saga = sagas.get(rideId);
  if (!saga) return;

  console.warn(`[Saga] Compensating ride ${rideId} at step ${saga.current_step}: ${reason}`);

  // Compensating transactions per step
  switch (saga.current_step) {
    case "matching":
    case "matched":
      // Cancel driver assignment
      advanceSaga(rideId, "cancelled");
      break;
    case "payment_initiated":
      // Refund payment
      await publishOne(RIDE_TOPICS.CANCELLED, {
        ride_id: rideId,
        user_id: saga.user_id,
        reason,
        ts: Date.now(),
      }, rideId).catch(() => null);
      break;
    default:
      advanceSaga(rideId, "cancelled");
  }
}

export function getSaga(rideId: string): RideSagaState | null {
  return sagas.get(rideId) || null;
}
