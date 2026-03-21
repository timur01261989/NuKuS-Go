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

test("client taxi page extracts main and route sheets into dedicated components", () => {
  const page = read("src/modules/client/features/client/taxi/ClientTaxiPage.impl.jsx");
  assert.ok(page.includes("import TaxiMainSheet"));
  assert.ok(page.includes("import TaxiRouteSheet"));
  assert.ok(page.includes("<TaxiMainSheet"));
  assert.ok(page.includes("<TaxiRouteSheet"));

  const mainSheet = read("src/modules/client/features/client/taxi/components/TaxiMainSheet.jsx");
  const routeSheet = read("src/modules/client/features/client/taxi/components/TaxiRouteSheet.jsx");
  assert.ok(mainSheet.includes("Buyurtma berish"));
  assert.ok(routeSheet.includes("Navigator"));
});

test("driver taxi page is routed through dedicated controller hook", () => {
  const page = read("src/modules/driver/legacy/city-taxi/CityTaxiPageInner.jsx");
  const hook = read("src/modules/driver/legacy/city-taxi/hooks/useDriverTaxiController.js");
  assert.ok(page.includes("useDriverTaxiController"));
  assert.ok(hook.includes("useTaxiSocket"));
  assert.ok(hook.includes("useDriverLocation"));
  assert.ok(hook.includes("useOrderActions"));
});
