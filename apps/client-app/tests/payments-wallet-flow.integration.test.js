
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { reserveWalletAmount, captureReservedWalletAmount } from "../server/_shared/payments/helpers.js";
import { createMemorySupabase } from "./_helpers/mockSupabase.js";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

test("reserveWalletAmount increases reserved_uzs without changing balance", async () => {
  const supabase = createMemorySupabase({
    wallets: [{ user_id: "u1", balance_uzs: 50000, reserved_uzs: 10000, total_spent_uzs: 0, is_frozen: false }]
  });

  const result = await reserveWalletAmount(supabase, "u1", 7000);

  assert.equal(result.nextReserved, 17000);
  assert.equal(supabase.state.wallets.get("u1").balance_uzs, 50000);
  assert.equal(supabase.state.wallets.get("u1").reserved_uzs, 17000);
});

test("captureReservedWalletAmount consumes reservation before debiting balance", async () => {
  const supabase = createMemorySupabase({
    wallets: [{ user_id: "u1", balance_uzs: 50000, reserved_uzs: 12000, total_spent_uzs: 0, is_frozen: false }]
  });

  const result = await captureReservedWalletAmount(supabase, "u1", 15000);

  assert.equal(result.reservationUsed_uzs, 12000);
  assert.equal(result.extraDebit_uzs, 3000);
  assert.equal(supabase.state.wallets.get("u1").reserved_uzs, 0);
  assert.equal(supabase.state.wallets.get("u1").balance_uzs, 47000);
  assert.equal(supabase.state.wallets.get("u1").total_spent_uzs, 15000);
});

test("payments handler keeps duplicate capture guard inside wallet complete flow before capture call", () => {
  const content = fs.readFileSync(path.join(root, "server/api/payments.js"), "utf8");
  const fnStart = content.indexOf("async function handleWalletComplete");
  const fnEnd = content.indexOf("async function handlePromoApply");
  const fnBody = content.slice(fnStart, fnEnd);
  const duplicateIdx = fnBody.indexOf("findExistingOrderCapture");
  const captureIdx = fnBody.indexOf("captureReservedWalletAmount");
  assert.notEqual(duplicateIdx, -1);
  assert.notEqual(captureIdx, -1);
  assert.ok(duplicateIdx < captureIdx, "duplicate capture guard should run before captureReservedWalletAmount");
});
