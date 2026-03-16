import crypto from "crypto";
import { getServerEnv } from "./env.js";

export function verifyPaymeSignature(payload = {}, providedSignature = "") {
  const env = getServerEnv();
  if (!env.PAYME_MERCHANT_KEY || !providedSignature) return false;
  const values = [
    payload?.id ?? "",
    payload?.time ?? "",
    payload?.amount ?? payload?.params?.amount ?? "",
    payload?.account?.order_id ?? payload?.params?.account?.order_id ?? "",
  ].map((v) => String(v));
  const material = values.join(":");
  const digest = crypto.createHmac("sha256", env.PAYME_MERCHANT_KEY).update(material).digest("hex");
  return digest === String(providedSignature).trim();
}

export function verifyClickSignature(payload = {}) {
  const env = getServerEnv();
  if (!env.CLICK_SECRET_KEY) return false;
  const fields = [
    payload?.click_trans_id,
    payload?.service_id,
    payload?.merchant_trans_id,
    payload?.amount,
    payload?.action,
    payload?.sign_time,
  ].map((v) => String(v ?? ""));
  const signString = fields.join("") + env.CLICK_SECRET_KEY;
  const digest = crypto.createHash("md5").update(signString).digest("hex");
  return digest === String(payload?.sign_string || "").trim();
}
