import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

test("batch21 docs exist with canonical auth and routing guidance", () => {
  const authDoc = fs.readFileSync(path.join(root, "AUTH_ACCESS_MODEL.md"), "utf8");
  const routingDoc = fs.readFileSync(path.join(root, "ROUTING_RULES.md"), "utf8");
  const envDoc = fs.readFileSync(path.join(root, "ENV_CONTRACT.md"), "utf8");
  const envExample = fs.readFileSync(path.join(root, ".env.example"), "utf8");

  assert.match(authDoc, /driver_approved/);
  assert.match(authDoc, /selectAccessState\(auth\)/);
  assert.match(routingDoc, /routePaths\.js/);
  assert.match(routingDoc, /\/driver\/dashboard/);
  assert.match(envDoc, /VITE_API_BASE_URL/);
  assert.match(envExample, /SUPABASE_SERVICE_ROLE_KEY=/);
});

test("payments flow uses wallet reservation before capture", () => {
  const payments = fs.readFileSync(path.join(root, "server/api/payments.js"), "utf8");
  const helpers = fs.readFileSync(path.join(root, "server/_shared/payments/helpers.js"), "utf8");

  assert.match(payments, /findExistingOrderAuthorization/);
  assert.match(payments, /reserveWalletAmount\(supabase, canonicalUserId, payableAmount\)/);
  assert.match(payments, /captureReservedWalletAmount\(supabase, canonicalUserId, amountToCapture\)/);
  assert.match(helpers, /export async function reserveWalletAmount/);
  assert.match(helpers, /export async function captureReservedWalletAmount/);
});
