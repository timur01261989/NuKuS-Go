import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(projectRoot, rel), "utf8");
}

test("shared taxi status layer exists", async () => {
  const mod = await import(path.join(projectRoot, "src/modules/shared/taxi/constants/taxiStatuses.js"));
  assert.equal(mod.TAXI_STATUS.SEARCHING, "searching");
  assert.equal(mod.normalizeTaxiStatus("ON_TRIP"), "on_trip");
  assert.equal(mod.normalizeTaxiStatus("done"), "completed");
  assert.equal(mod.getTaxiUiStepFromStatus("accepted"), "coming");
});

test("client polling no longer double-fires tick immediately", () => {
  const file = read("src/modules/client/features/client/taxi/hooks/useTaxiOrderPolling.js");
  assert.ok(file.includes("getTaxiPollingInterval("));
  assert.ok(!file.includes("tick();\n    const loop"));
});

test("driver api is routed through shared taxi api", () => {
  const file = read("src/modules/driver/legacy/city-taxi/services/cityTaxiApi.js");
  assert.ok(file.includes('import taxiClientApi'));
  assert.ok(file.includes('listDriverAvailableOrders'));
});

test("silent taxi catches replaced with logger on critical phase1 files", () => {
  const files = [
    "src/modules/client/features/client/taxi/hooks/useTaxiOrderPolling.js",
    "src/modules/driver/legacy/city-taxi/hooks/useDriverLocation.js",
    "src/modules/driver/legacy/city-taxi/hooks/useOrderActions.js",
    "src/modules/driver/legacy/city-taxi/hooks/useTaxiSocket.js",
  ];
  for (const rel of files) {
    const content = read(rel);
    assert.ok(content.includes("taxiLogger"), `${rel} should use taxiLogger`);
  }
});
