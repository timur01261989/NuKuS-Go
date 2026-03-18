import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

test('auto market phase2 journey service exists', () => {
  const text = read('src/modules/client/features/auto-market/services/autoMarketJourney.js');
  assert.match(text, /buildFeedJourneyCards/);
  assert.match(text, /buildDetailConfidenceSteps/);
  assert.match(text, /buildSellerPostingChecklist/);
});

test('feed and details pages use journey guidance', () => {
  const feed = read('src/modules/client/features/auto-market/pages/FeedPage.jsx');
  const details = read('src/modules/client/features/auto-market/pages/DetailsPage.jsx');
  assert.match(feed, /Qayerdan boshlashni o‘ylab o‘tirmang/);
  assert.match(feed, /Body type guide/);
  assert.match(details, /Bu e’lonni tushunish uchun 3 narsa kifoya/);
  assert.match(details, /Professional detail flow/);
});

test('create flow uses seller checklist and photo coach notes', () => {
  const wizard = read('src/modules/client/features/auto-market/components/Create/CreateAdWizard.jsx');
  const guide = read('src/modules/client/features/auto-market/components/Create/PhotoAngleGuide.jsx');
  assert.match(wizard, /E’lon tayyorlik checklisti/);
  assert.match(wizard, /Sotuvchi uchun qulay professional oqim/);
  assert.match(guide, /coachNotes/);
});
