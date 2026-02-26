/**
 * server/api/_registry.js
 * -------------------------------------------------------
 * Central API registry.
 * Keep ONE import place for all API modules.
 * This helps Vercel single-function router stay clean.
 */

import order from "./order.js";
import auth from "./auth.js";
import driver from "./driver.js";
import dispatch from "./dispatch.js";
import offer from "./offer.js";
import wallet from "./wallet.js";
import sos from "./sos.js";
import presence from "./presence.js";
import cron_dispatch from "./cron_dispatch.js";
import notifications from "./notifications.js";
import gamification from "./gamification.js";
import pricing from "./pricing.js";

export const ROUTES = {
  order,
  auth,
  driver,
  dispatch,
  offer,
  wallet,
  sos,
  presence,
  cron_dispatch,
  notifications,
  gamification,
  pricing,
};

// Which top-level routes require auth by default.
export const AUTH_REQUIRED = new Set([
  "order",
  "driver",
  "dispatch",
  "offer",
  "wallet",
  "sos",
  "presence",
  "cron_dispatch",
  "notifications",
  "gamification",
  // pricing/auth are public
]);
