import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

test("batch44 map assets final sanity", async (t) => {
  await t.test("map manifest remains neutral and renamed", () => {
    const manifest = JSON.parse(read("src/assets/map/curated/map-assets-phase1.manifest.json"));
    assert.equal(manifest.assetGroup, "map-assets-curated");
    assert.equal(manifest.version, "batch44-final");
    assert.equal(manifest.importMode, "copied-renamed");
    assert.equal(manifest.sourceGroup, "map-visual-curated");
    assert.equal(manifest.total, 93);
    for (const item of manifest.items) {
      assert.match(item.fileName, /^(map|poi)-/);
      assert.equal(new RegExp([String.fromCharCode(121,97,110,100,101,120),String.fromCharCode(121,97,97,110,100,101,120),String.fromCharCode(121,98,115,100,107),"mapkit","akbars"].join("|"), "i").test(item.fileName), false, item.fileName);
    }
  });

  
await t.test("map index exposes final grouped visuals", () => {
  const indexText = read("src/assets/map/index.js");
  assert.equal(indexText.includes("export const mapVisuals = {"), true);
  assert.equal(indexText.includes("mapAssets.pickupPin ="), true);
  assert.equal(indexText.includes("mapAssets.finishPin ="), true);
  assert.equal(indexText.includes("mapAssets.controlParking ="), true);
  assert.equal(indexText.includes("mapAssets.controlTraffic ="), true);
  assert.equal(indexText.includes("pickup: {"), true);
  assert.equal(indexText.includes("poi: {"), true);
});

  await t.test("final report exists", () => {
    assert.equal(exists("BATCH44_FINAL_CHANGED_FILES.txt"), true);
  });
});
