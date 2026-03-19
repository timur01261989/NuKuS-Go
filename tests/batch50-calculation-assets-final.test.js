import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

test('batch50 taxi wrappers use calculation assets and guidance helpers', () => {
  const header = read('src/modules/client/features/client/taxi/components/TaxiHeader.jsx');
  const pickup = read('src/modules/client/features/client/taxi/components/TaxiPickupCard.jsx');
  const destination = read('src/modules/client/features/client/taxi/components/TaxiDestinationCard.jsx');
  const actions = read('src/modules/client/features/client/taxi/components/TaxiActionsBar.jsx');

  assert.match(header, /taxiPricingReminderFlow/);
  assert.match(pickup, /calculationAssets\.payment\./);
  assert.match(destination, /buildFareExplainer/);
  assert.match(actions, /Promokodni qo‘llash/);
});

test('batch50 calculation idea helpers remain neutral', () => {
  const guidance = read('src/modules/client/features/client/taxi/taxiPricingGuidance.js');
  const explainer = read('src/modules/client/features/client/taxi/taxiFareExplainer.js');
  const promo = read('src/modules/client/features/client/pages/clientPromoGuidance.js');

  for (const content of [guidance, explainer, promo]) {
    assert.equal(content.includes('vendor-source'), false);
  }
});

test('batch50 final report exists', () => {
  assert.equal(fs.existsSync(path.join(root, 'BATCH50_FINAL_CHANGED_FILES.txt')), true);
});
