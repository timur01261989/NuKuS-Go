export const USER_TOPICS = {
  REGISTERED:   "user.registered",
  LOGGED_IN:    "user.logged_in",
  PROFILE_UPDATED: "user.profile_updated",
  DELETED:      "user.deleted",
} as const;

export type UserTopic = typeof USER_TOPICS[keyof typeof USER_TOPICS];
