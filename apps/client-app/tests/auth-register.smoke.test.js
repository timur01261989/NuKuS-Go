import test from "node:test";
import assert from "node:assert/strict";
import { restorePreferredPhone, validateLoginInput, buildPostLoginProfileUpdate } from "../src/modules/client/features/auth/pages/auth.logic.js";
import { buildRegisterInitialForm, getReferralCodeFromSearch, normalizeOtpValue, canRequestSignupOtp } from "../src/modules/client/features/auth/pages/register.logic.js";

test("auth smoke: login validation and profile update payload work", () => {
  global.localStorage = {
    getItem(key) { return key === "last_phone" ? "90 123-45-67" : null; },
  };
  const restored = restorePreferredPhone({
    location: { state: {} },
    currentPhone: "",
    normalizePhoneInput: (v) => String(v || "").replace(/\D/g, "").slice(-9),
  });
  assert.equal(restored, "901234567");

  const valid = validateLoginInput({
    phone: "90 123 45 67",
    password: "secret123",
    t: { phoneRequired: "phone", passwordRequired: "pass" },
  });
  assert.equal(valid.ok, true);
  assert.equal(valid.digits, "901234567");

  const payload = buildPostLoginProfileUpdate("user-1");
  assert.equal(payload.id, "user-1");
  assert.equal(payload.role, "client");
  assert.equal(payload.phone_verified, true);
});

test("register smoke: referral, otp and request validation work", () => {
  const params = new URLSearchParams("ref= Abc-123 ");
  const initial = buildRegisterInitialForm(params, (v) => String(v || "").trim().toUpperCase());
  assert.equal(initial.referralCode, "ABC-123");

  const refCode = getReferralCodeFromSearch(params, (v) => String(v || "").trim().toLowerCase());
  assert.equal(refCode, "abc-123");

  assert.equal(normalizeOtpValue("12a34b567"), "123456");

  const err = canRequestSignupOtp({
    name: "",
    surname: "",
    phoneDigits: "90123",
    password: "123",
    tr: (_k, fallback) => fallback,
  });
  assert.match(err, /Ism va familiya|Telefon|Parol/);

  const ok = canRequestSignupOtp({
    name: "Ali",
    surname: "Valiyev",
    phoneDigits: "901234567",
    password: "123456",
    tr: (_k, fallback) => fallback,
  });
  assert.equal(ok, null);
});
