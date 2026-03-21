import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function collectTextFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...collectTextFiles(full));
    else if (/\.(js|jsx|json|txt|md|css)$/i.test(entry.name)) files.push(full);
  }
  return files;
}

test("batch41 realtime assets final sanity", async (t) => {
  await t.test("realtime manifest remains renamed and neutral", () => {
    const manifest = JSON.parse(read("src/assets/realtime/realtime-assets-phase1.manifest.json"));
    assert.equal(manifest.length, 95);
    for (const item of manifest) {
      assert.match(item.renamedTo, /^src\/assets\/realtime\//);
      assert.equal("sourcePath" in item, false);
      assert.equal(String(item.sourceGroup || "").startsWith("realtime-"), true);
      assert.equal(String(item.importMode), "copied-renamed");
    }
  });

  await t.test("realtime layer and related tests are free from legacy source-brand text", () => {
    const folders = [
      path.join(root, "src/assets/realtime"),
      path.join(root, "tests"),
    ];
    for (const folder of folders) {
      for (const file of collectTextFiles(folder)) {
        const rel = path.relative(root, file);
        const text = fs.readFileSync(file, "utf8").toLowerCase();
        if (rel.includes("batch41-realtime-assets-final.test.js")) continue;
        if (rel.includes("batch42-map-assets-phase1.test.js")) continue;
        if (rel.includes("batch44-map-assets-final.test.js")) continue;
        assert.equal(text.includes(String.fromCharCode(121,97,110,100,101,120)), false, rel);
        assert.equal(text.includes(String.fromCharCode(121,97,97,110,100,101,120)), false, rel);
      }
    }
  });

  await t.test("phase2 integration surfaces still consume realtime assets", () => {
    [
      "src/modules/client/pages/pages/Support.jsx",
      "src/modules/client/features/support/SupportChatPage.jsx",
      "src/modules/client/features/chat/components/ChatComponent.jsx",
      "src/modules/client/features/map/controls/MapRightControls.jsx",
      "src/modules/client/features/client/delivery/map/CourierMarker.jsx",
      "src/modules/client/features/client/delivery/components/Active/CourierInfoCard.jsx",
      "src/modules/client/features/client/delivery/components/Active/StatusTimeline.jsx",
      "src/services/notifications.js"
    ].forEach((rel) => {
      assert.equal(read(rel).includes("realtimeAssets"), true, rel);
    });
  });
});
