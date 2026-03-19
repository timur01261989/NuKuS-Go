import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

test('auto market final decision support service exists', () => {
  const content = read('src/modules/client/features/auto-market/services/autoMarketDecisionSupport.js');
  assert.match(content, /buildBuyerDecisionChecklist/);
  assert.match(content, /buildCompareHighlights/);
  assert.match(content, /buildSellerPerformanceSummary/);
});

test('compare page uses decision support highlights', () => {
  const content = read('src/modules/client/features/auto-market/pages/ComparePage.jsx');
  assert.match(content, /buildCompareHighlights/);
  assert.match(content, /Eng qulay variant/);
});

test('favorites page adds decision checklist experience', () => {
  const content = read('src/modules/client/features/auto-market/pages/FavoritesPage.jsx');
  assert.match(content, /Sevimlilarni adashmay boshqaring/);
  assert.match(content, /buildBuyerDecisionChecklist/);
});

test('seller and dashboard experience layers exist', () => {
  const seller = read('src/modules/client/features/auto-market/components/Details/SellerProfile.jsx');
  const myAds = read('src/modules/client/features/auto-market/pages/MyAdsPage.jsx');
  assert.match(seller, /Xaridor uchun qulay aloqa/);
  assert.match(myAds, /buildSellerPerformanceSummary/);
});
