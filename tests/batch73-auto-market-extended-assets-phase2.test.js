import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

test("extended assets index includes new body types and inspection assets", () => {
  const text = fs.readFileSync(path.join(root, "src/assets/auto-market/extended/index.js"), "utf8");
  for (const needle of [
    "body-camper.svg",
    "body-commercial.svg",
    "body-station-wagon.svg",
    "inspection-certificate.png",
    "signal-price-drop.webp",
  ]) {
    assert.ok(text.includes(needle), needle);
  }
});

test("extended signals service exposes dealer ladder and inspection certificate builders", () => {
  const text = fs.readFileSync(path.join(root, "src/modules/client/features/auto-market/services/autoMarketExtendedSignals.js"), "utf8");
  for (const needle of [
    "buildDealerTierLadder",
    "buildInspectionCertificateCard",
    "signal_price_drop",
    "state_favorites_guidance",
  ]) {
    assert.ok(text.includes(needle), needle);
  }
});

test("ui surfaces reference new extended helpers", () => {
  const files = [
    "src/modules/client/features/auto-market/pages/DealerProfilePage.jsx",
    "src/modules/client/features/auto-market/pages/DetailsPage.jsx",
    "src/modules/client/features/auto-market/components/Filters/FullFilterDrawer.jsx",
  ];
  const merged = files.map((file) => fs.readFileSync(path.join(root, file), "utf8")).join("\n");
  for (const needle of [
    "buildDealerTierLadder",
    "buildInspectionCertificateCard",
    "extendedBodyVisuals = useMemo",
  ]) {
    assert.ok(merged.includes(needle), needle);
  }
});
