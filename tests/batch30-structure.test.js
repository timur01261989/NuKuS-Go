import fs from "fs";
import path from "path";
import test from "node:test";
import assert from "node:assert/strict";

const ROOT = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

test("batch30 order assets integration", async (t) => {
  await t.test("adds booking and search asset registries", () => {
    assert.equal(fs.existsSync(path.join(ROOT, "src/assets/booking/index.js")), true);
    assert.equal(fs.existsSync(path.join(ROOT, "src/assets/search/index.js")), true);
  });

  await t.test("wires strengthened order/support pages to asset layers", () => {
    const rideHistory = read("src/modules/client/features/shared/components/RideHistory.jsx");
    const tripHistory = read("src/modules/client/features/client/components/TripHistory.jsx");
    const timeline = read("src/modules/client/features/client/taxi/components/TaxiOrderTimeline.jsx");
    const statusTimeline = read("src/modules/client/features/client/delivery/components/Active/StatusTimeline.jsx");
    const myAddresses = read("src/modules/client/pages/pages/myAddresses.sections.jsx");

    assert.equal(rideHistory.includes("supportAssets"), true);
    assert.equal(tripHistory.includes("supportAssets") || tripHistory.includes("orderAssets"), true);
    assert.equal(timeline.includes("bookingAssets"), true);
    assert.equal(statusTimeline.includes("orderAssets") || statusTimeline.includes("bookingAssets"), true);
    assert.equal(myAddresses.includes("searchAssets"), true);
  });
});
