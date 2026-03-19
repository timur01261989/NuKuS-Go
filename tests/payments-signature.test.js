import test from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { verifyPaymeSignature, verifyClickSignature } from "../server/_shared/auth-headers.js";

test("verifyPaymeSignature accepts valid signature", () => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
  process.env.PAYME_MERCHANT_KEY = "payme-secret";
  const payload = { id: "p1", time: "1000", amount: "5000", account: { order_id: "ord-1" } };
  const signature = crypto.createHmac("sha256", "payme-secret").update("p1:1000:5000:ord-1").digest("hex");
  assert.equal(verifyPaymeSignature(payload, signature), true);
});

test("verifyClickSignature accepts valid signature", () => {
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
  process.env.CLICK_SECRET_KEY = "click-secret";
  const payload = {
    click_trans_id: "1",
    service_id: "2",
    merchant_trans_id: "3",
    amount: "4500",
    action: "0",
    sign_time: "2026-03-16 12:00:00",
  };
  payload.sign_string = crypto.createHash("md5").update("123450002026-03-16 12:00:00click-secret").digest("hex");
  assert.equal(verifyClickSignature(payload), true);
});
