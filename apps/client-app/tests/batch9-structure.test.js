import fs from "fs";
import path from "path";
import test from "node:test";
import assert from "node:assert/strict";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

test("batch9 helper modules are wired into remaining large pages and services", () => {
  const freight = read("src/modules/driver/legacy/freight/FreightPage.jsx");
  const freightHelpers = read("src/modules/driver/legacy/freight/FreightPage.helpers.jsx");
  const interProv = read("src/modules/driver/legacy/inter-provincial/InterProvincialPage.jsx");
  const interProvHelpers = read("src/modules/driver/legacy/inter-provincial/InterProvincialPage.helpers.jsx");
  const register = read("src/modules/client/features/auth/pages/Register.jsx");
  const registerHelpers = read("src/modules/client/features/auth/pages/register.helpers.js");
  const apiHelper = read("src/modules/shared/utils/apiHelper.js");
  const apiHelperCore = read("src/modules/shared/utils/apiHelper.core.js");

  assert.match(freight, /FreightPage\.helpers/);
  assert.match(freightHelpers, /export const BODY_TYPES/);
  assert.match(freightHelpers, /export function LocationPickerModal/);

  assert.match(interProv, /InterProvincialPage\.helpers/);
  assert.match(interProvHelpers, /export function getRegionCenter/);
  assert.match(interProvHelpers, /export function TripRow/);

  assert.match(register, /register\.helpers/);
  assert.match(registerHelpers, /export function normalizePhoneInput/);
  assert.match(registerHelpers, /export function buildFullName/);

  assert.match(apiHelper, /apiHelper\.core/);
  assert.match(apiHelperCore, /export const joinUrl/);
  assert.match(apiHelperCore, /export const inflight/);
});
