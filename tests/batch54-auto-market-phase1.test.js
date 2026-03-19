import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const mustExist = [
  "src/assets/auto-market/pro/index.js",
  "src/assets/auto-market/pro/auto-market-pro-phase1.manifest.json",
  "src/modules/client/features/auto-market/components/Feed/BodyTypeScroller.jsx",
  "src/modules/client/features/auto-market/components/Details/InspectionViewer.jsx",
  "src/modules/client/features/auto-market/components/Details/AppointmentBookingCard.jsx",
  "src/modules/client/features/auto-market/components/Create/PhotoAngleGuide.jsx",
  "src/modules/client/features/auto-market/services/instantMarketValue.js",
  "src/modules/client/features/auto-market/services/inspectionScoring.js",
  "src/modules/client/features/auto-market/services/financeEstimator.js"
];

test("phase1 auto-market curated layer exists", () => {
  for (const rel of mustExist) {
    assert.equal(fs.existsSync(path.join(root, rel)), true, rel);
  }
});

test("phase1 auto-market touched files have no vendor literals", () => {
  const touched = [
    "src/assets/auto-market/pro/index.js",
    "src/modules/client/features/auto-market/pages/FeedPage.jsx",
    "src/modules/client/features/auto-market/pages/DetailsPage.jsx",
    "src/modules/client/features/auto-market/components/Feed/SmartFilterBar.jsx",
    "src/modules/client/features/auto-market/components/Details/SellerProfile.jsx"
  ];

  for (const rel of touched) {
    const content = fs.readFileSync(path.join(root, rel), "utf8").toLowerCase();
    const blocked = [
      String.fromCharCode(121,97,110,100,101,120),
      String.fromCharCode(121,97,97,110,100,101,120),
      String.fromCharCode(121,97,110,103,111),
    ];
    for (const word of blocked) {
      assert.equal(content.includes(word), false, `${rel}:${word}`);
    }
  }
});

test("phase1 auto-market manifest counts are non-empty", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "src/assets/auto-market/pro/auto-market-pro-phase1.manifest.json"), "utf8"));
  assert.ok(manifest.counts["body-types"] >= 20);
  assert.ok(manifest.counts.finance >= 4);
  assert.ok(manifest.counts.inspection >= 8);
});