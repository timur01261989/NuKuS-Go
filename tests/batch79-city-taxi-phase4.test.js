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

function listTaxiFiles() {
  const roots = [
    path.join(projectRoot, "src/modules/client/features/client/taxi"),
    path.join(projectRoot, "src/modules/driver/legacy/city-taxi"),
    path.join(projectRoot, "src/modules/shared/taxi"),
  ];
  const files = [];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    const stack = [root];
    while (stack.length) {
      const current = stack.pop();
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const abs = path.join(current, entry.name);
        if (entry.isDirectory()) stack.push(abs);
        else if (/\.(js|jsx)$/.test(entry.name)) files.push(abs);
      }
    }
  }
  return files;
}

test("phase4 quality gate removes empty catches from critical taxi modules", () => {
  const criticalFiles = [
    "src/modules/client/features/client/taxi/ClientTaxiPage.impl.jsx",
    "src/modules/client/features/client/taxi/hooks/useTaxiOrder.core.js",
    "src/modules/client/features/client/taxi/hooks/useTaxiOrderCreate.js",
    "src/modules/client/features/client/taxi/lib/taxiSpeech.js",
    "src/modules/client/features/client/taxi/lib/taxiStorage.js",
    "src/modules/client/features/client/taxi/services/driverTracker.js",
  ];
  for (const rel of criticalFiles) {
    const file = read(rel);
    assert.ok(!/catch\s*(\([^)]*\))?\s*\{\s*\}/.test(file), `${rel} still contains empty catch`);
    assert.ok(file.includes("taxiLogger"), `${rel} should log through taxiLogger`);
  }
});

test("shared taxi phase gate remains wired through canonical status layer", async () => {
  const constants = await import(path.join(projectRoot, "src/modules/shared/taxi/constants/taxiStatuses.js"));
  const mapServer = await import(path.join(projectRoot, "src/modules/shared/taxi/mappers/mapServerTaxiStatus.js"));
  const mapDriver = await import(path.join(projectRoot, "src/modules/shared/taxi/mappers/mapDriverTaxiStatus.js"));
  assert.equal(constants.normalizeTaxiStatus("ARRIVED"), "arrived");
  assert.equal(mapServer.default("DONE"), "completed");
  assert.equal(mapDriver.default("ON_TRIP"), "on_trip");
});

test("city taxi quality audit keeps critical phase components split and connected", () => {
  const clientPage = read("src/modules/client/features/client/taxi/ClientTaxiPage.impl.jsx");
  const driverPage = read("src/modules/driver/legacy/city-taxi/CityTaxiPageInner.jsx");
  const controller = read("src/modules/driver/legacy/city-taxi/hooks/useDriverTaxiController.js");
  assert.ok(clientPage.includes("TaxiMainSheet"));
  assert.ok(clientPage.includes("TaxiRouteSheet"));
  assert.ok(driverPage.includes("DriverConnectionBadge"));
  assert.ok(driverPage.includes("DriverDaySnapshot"));
  assert.ok(controller.includes("useTaxiSocket"));
  assert.ok(controller.includes("useDriverLocation"));
});

test("taxi module files do not contain vendor traces", () => {
  const needles = ["ya" + "ndex", "yaa" + "ndex", "ya" + "ngo"];
  for (const abs of listTaxiFiles()) {
    const content = fs.readFileSync(abs, "utf8").toLowerCase();
    for (const needle of needles) {
      assert.ok(!content.includes(needle), `${path.relative(projectRoot, abs)} contains vendor trace`);
    }
  }
});
