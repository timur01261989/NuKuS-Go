import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const root = process.cwd();
const orderRoot = path.join(root, "src/assets/order");
const blockedCards = [
  "card_mastercard.png",
  "card_mir.png",
  "card_unionpay.png",
  "card_visa.png",
  "card_none.png",
];
const blockedMarkers = [
  new RegExp(["y", "a", "n", "d", "e", "x"].join(""), "i"),
  new RegExp(["y", "a", "a", "n", "d", "e", "x"].join(""), "i"),
];

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

test("batch36 phase1 order asset import", async (t) => {
  await t.test("keeps selected order asset families present", () => {
    const required = [
      "src/assets/order/courier/order-box.webp",
      "src/assets/order/courier/order-progress-pin.webp",
      "src/assets/order/tracking/courier-default-car.webp",
      "src/assets/order/tracking/courier-deli-scooter.webp",
      "src/assets/order/history/order-receipt.svg",
      "src/assets/order/history/order-support-alt.svg",
      "src/assets/order/chat/chat-attach.png",
      "src/assets/order/chat/chat-jump-last-message.png",
      "src/assets/order/services/service-connector-dark.svg",
      "src/assets/order/services/service-station-store.svg",
      "src/assets/order/index.js",
      "src/assets/order/order-assets-phase1.manifest.json",
    ];
    for (const rel of required) {
      assert.equal(fs.existsSync(path.join(root, rel)), true, rel);
    }
  });

  await t.test("excludes unwanted card brand assets", () => {
    const files = walk(orderRoot).map((abs) => path.basename(abs).toLowerCase());
    for (const blocked of blockedCards) {
      assert.equal(files.includes(blocked), false, `blocked card asset copied: ${blocked}`);
    }
  });

  await t.test("keeps paths and text vendor-neutral", () => {
    for (const abs of walk(orderRoot)) {
      const rel = path.relative(root, abs);
      for (const rx of blockedMarkers) {
        assert.equal(rx.test(rel), false, `blocked marker in path: ${rel}`);
      }
      const ext = path.extname(abs).toLowerCase();
      if ([".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext)) continue;
      const text = fs.readFileSync(abs, "utf8").toLowerCase();
      for (const rx of blockedMarkers) {
        assert.equal(rx.test(text), false, `blocked marker in content: ${rel}`);
      }
    }
  });

  await t.test("records expected imported asset count", () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(orderRoot, "order-assets-phase1.manifest.json"), "utf8"),
    );
    assert.equal(manifest.total_files, 79);
    assert.deepEqual(manifest.counts, {
      courier: 14,
      tracking: 11,
      history: 15,
      chat: 24,
      services: 15,
    });
  });
});
