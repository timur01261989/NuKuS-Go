export const RIDE_TOPICS = {
  CREATED:    "ride.created",
  MATCHED:    "ride.matched",
  ACCEPTED:   "ride.accepted",
  STARTED:    "ride.started",
  COMPLETED:  "ride.completed",
  CANCELLED:  "ride.cancelled",
} as const;

export type RideTopic = typeof RIDE_TOPICS[keyof typeof RIDE_TOPICS];
