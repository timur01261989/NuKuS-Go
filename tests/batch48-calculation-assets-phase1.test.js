import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function blockedTerms() {
  return [
    String.fromCharCode(121, 97, 110, 100, 101, 120),
    String.fromCharCode(121, 97, 97, 110, 100, 101, 120),
    String.fromCharCode(121, 97, 110, 103, 111),
  ];
}

test('batch48 calculation asset layer exists', () => {
  const required = [
    'src/assets/calculation/index.js',
    'src/assets/calculation/calculation-assets-phase1.manifest.json',
    'src/modules/client/features/client/taxi/taxiPricingGuidance.js',
    'src/modules/client/features/client/taxi/taxiFareExplainer.js',
    'src/modules/client/features/client/pages/clientPromoGuidance.js',
  ];
  required.forEach((rel) => assert.equal(fs.existsSync(path.join(root, rel)), true, rel));
});

test('batch48 calculation manifest uses neutral metadata only', () => {
  const json = fs.readFileSync(path.join(root, 'src/assets/calculation/calculation-assets-phase1.manifest.json'), 'utf8').toLowerCase();
  assert.equal(json.includes('importmode'), true);
  assert.equal(json.includes('sourcegroup'), true);
  assert.equal(json.includes('vendor'), false);
});

test('batch48 tariff visuals were renamed to neutral files', () => {
  const tariffDir = path.join(root, 'src/assets/calculation/tariffs');
  const names = fs.readdirSync(tariffDir);
  assert.deepEqual(names.sort(), [
    'tariff-business.webp',
    'tariff-comfort-plus.webp',
    'tariff-comfort.webp',
    'tariff-economy.webp',
  ]);
});

test('batch48 touched files are free from blocked vendor literals', () => {
  const touched = [
    'src/assets/calculation/index.js',
    'src/assets/calculation/calculation-assets-phase1.manifest.json',
    'src/modules/client/features/client/taxi/taxiPricingGuidance.js',
    'src/modules/client/features/client/taxi/taxiFareExplainer.js',
    'src/modules/client/features/client/taxi/components/TariffSelector.jsx',
    'src/modules/client/features/client/taxi/components/TaxiFareCard.jsx',
    'src/modules/client/features/client/pages/ClientPromo.jsx',
    'src/modules/client/features/client/pages/clientPromoGuidance.js',
    'tests/batch46-security-assets-phase2.test.js',
    'tests/batch47-security-assets-final.test.js',
  ];
  touched.forEach((rel) => {
    const content = fs.readFileSync(path.join(root, rel), 'utf8').toLowerCase();
    blockedTerms().forEach((blocked) => {
      assert.equal(content.includes(blocked), false, `${rel} contains blocked literal`);
    });
  });
});
