import fs from "fs";
import path from "path";
import test from "node:test";
import assert from "node:assert/strict";

const root = process.cwd();
const mustExist = [
  "src/assets/map/pins/map-pin-electric-station.webp",
  "src/assets/support/attachments/attachment-ride.png",
  "src/assets/support/chat/chat-rating-stars.png",
  "src/assets/support/service-icons/service-support.svg",
  "src/providers/route/premiumRoute.js",
];

test("batch32 realtime asset integration", async (t) => {
  await t.test("creates selected renamed assets", () => {
    mustExist.forEach((rel) => {
      assert.equal(fs.existsSync(path.join(root, rel)), true);
    });
  });

  await t.test("wires realtime assets into core UI files", () => {
    const rideHistory = fs.readFileSync(path.join(root, "src/modules/client/features/shared/components/RideHistory.jsx"), "utf8");
    const tripHistory = fs.readFileSync(path.join(root, "src/modules/client/features/client/components/TripHistory.jsx"), "utf8");
    const supportChat = fs.readFileSync(path.join(root, "src/modules/client/features/support/SupportChatPage.jsx"), "utf8");
    assert.equal(rideHistory.includes("resolveServiceIcon"), true);
    assert.equal(tripHistory.includes("resolveServiceIcon"), true);
    assert.equal(supportChat.includes("ratingStars"), true);
  });

  await t.test("removes legacy vendor naming from src runtime files touched in this batch", () => {
    const files = [
      "src/providers/route/index.js",
      "src/providers/route/premiumRoute.js",
      "src/modules/shared/utils/navigatorSync.js",
      "src/modules/client/features/debug/components/ProviderSwitchPanel.jsx",
    ];
    files.forEach((rel) => {
      const txt = fs.readFileSync(path.join(root, rel), "utf8").toLowerCase();
      assert.equal(txt.includes("legacy-vendor"), false);
      assert.equal(txt.includes("legacylegacy"), false);
    });
  });
});
