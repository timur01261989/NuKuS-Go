import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const root = process.cwd();

function mustExist(rel) {
  assert.equal(fs.existsSync(path.join(root, rel)), true, rel);
}

test("batch38 order assets phase3", async (t) => {
  await t.test("delivery ui components exist after phase3 polish", () => {
    [
      "src/modules/client/features/client/delivery/components/Active/StatusTimeline.jsx",
      "src/modules/client/features/client/delivery/components/Active/PinCodeDisplay.jsx",
      "src/modules/client/features/client/delivery/components/Setup/ParcelTypeChips.jsx",
      "src/modules/client/features/client/delivery/components/Setup/PhotoUploader.jsx",
      "src/modules/client/features/client/delivery/DeliveryPage.helpers.jsx",
    ].forEach(mustExist);
  });

  await t.test("phase3 components reference order asset layer", () => {
    const files = [
      "src/modules/client/features/client/delivery/components/Active/StatusTimeline.jsx",
      "src/modules/client/features/client/delivery/components/Active/PinCodeDisplay.jsx",
      "src/modules/client/features/client/delivery/components/Setup/ParcelTypeChips.jsx",
      "src/modules/client/features/client/delivery/components/Setup/PhotoUploader.jsx",
      "src/modules/client/features/client/delivery/DeliveryPage.helpers.jsx",
    ];
    for (const rel of files) {
      const text = fs.readFileSync(path.join(root, rel), "utf8");
      assert.match(text, /@\/assets\/order|orderAssets/);
    }
  });

  await t.test("phase3 keeps banned payment card files out of order asset folders", () => {
    const orderRoot = path.join(root, "src/assets/order");
    const blocked = ["mastercard", "unionpay", "visa", "mir", "card-none", "card_none"];
    const seen = [];
    function walk(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else seen.push(path.relative(orderRoot, full).toLowerCase());
      }
    }
    walk(orderRoot);
    for (const token of blocked) {
      assert.equal(seen.some((rel) => rel.includes(token)), false, token);
    }
  });
});
