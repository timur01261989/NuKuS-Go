import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const root = process.cwd();
const manifestPath = path.join(root, "src/assets/realtime/realtime-assets-phase1.manifest.json");

test("batch39 realtime assets phase1", async (t) => {
  await t.test("manifest and barrel exist", () => {
    assert.equal(fs.existsSync(manifestPath), true);
    assert.equal(fs.existsSync(path.join(root, "src/assets/realtime/index.js")), true);
  });

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  await t.test("imports only renamed neutral assets", () => {
    assert.equal(manifest.length, 95);
    for (const item of manifest) {
      assert.match(item.renamedTo, /^src\/assets\/realtime\//);
      const base = path.basename(item.renamedTo).toLowerCase();
      assert.equal(base.includes("realtime"), false, item.renamedTo);
      assert.equal(base.includes("mastercard"), false, item.renamedTo);
      assert.equal(base.includes("unionpay"), false, item.renamedTo);
      assert.equal(base.includes("visa"), false, item.renamedTo);
      assert.equal(base.includes("mir"), false, item.renamedTo);
      assert.equal(base.includes("none"), false, item.renamedTo);
      assert.equal(fs.existsSync(path.join(root, item.renamedTo)), true, item.renamedTo);
      assert.equal(Object.prototype.hasOwnProperty.call(item, "sourcePath"), false);
      assert.equal(String(item.sourceGroup || "").startsWith("realtime-"), true);
    }
  });

  await t.test("categories are present", () => {
    const categories = new Set(manifest.map((item) => item.category));
    [
      "navigation",
      "markers",
      "chat",
      "support",
      "notifications",
      "status",
    ].forEach((category) => assert.equal(categories.has(category), true, category));
  });

  await t.test("barrel exports representative assets", () => {
    const barrel = fs.readFileSync(path.join(root, "src/assets/realtime/index.js"), "utf8");
    [
      "trackingModeAuto",
      "markerDriver",
      "chatSendMessage",
      "supportCall",
      "notifyBellUnread",
      "statusSchedule",
    ].forEach((key) => assert.equal(barrel.includes(key), true, key));
  });
});
