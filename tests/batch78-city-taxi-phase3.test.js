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

test("client taxi phase3 exposes eta freshness and route fallback surface", () => {
  const signals = read("src/modules/shared/taxi/utils/taxiProductSignals.js");
  const etaBadge = read("src/modules/client/features/client/taxi/components/TaxiEtaBadge.jsx");
  const routeSheet = read("src/modules/client/features/client/taxi/components/TaxiRouteSheet.jsx");
  const polling = read("src/modules/client/features/client/taxi/hooks/useTaxiOrderPolling.js");
  assert.ok(signals.includes("buildTaxiEtaMeta"));
  assert.ok(signals.includes("buildTaxiRouteMeta"));
  assert.ok(etaBadge.includes("Yangilandi:"));
  assert.ok(routeSheet.includes("taxminiy marshrut"));
  assert.ok(polling.includes("setEtaUpdatedAt(Date.now())"));
});

test("client taxi cancel reasons are surfaced and routed through cancel payload", () => {
  const page = read("src/modules/client/features/client/taxi/ClientTaxiPage.impl.jsx");
  const actions = read("src/modules/client/features/client/taxi/hooks/useTaxiOrderActions.js");
  assert.ok(page.includes("cancelReasonOptions"));
  assert.ok(actions.includes("cancel_reason"));
});

test("driver taxi phase3 adds connection badge and day snapshot widgets", () => {
  const page = read("src/modules/driver/legacy/city-taxi/CityTaxiPageInner.jsx");
  const connection = read("src/modules/driver/legacy/city-taxi/components/widgets/DriverConnectionBadge.jsx");
  const snapshot = read("src/modules/driver/legacy/city-taxi/components/widgets/DriverDaySnapshot.jsx");
  assert.ok(page.includes("DriverConnectionBadge"));
  assert.ok(page.includes("DriverDaySnapshot"));
  assert.ok(connection.includes("Heartbeat:"));
  assert.ok(snapshot.includes("Bugun"));
});
