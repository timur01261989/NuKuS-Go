import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');

test('batch57 premium auto-market files exist and are neutral', () => {
  const servicePath = path.join(root, 'src/modules/client/features/auto-market/services/autoMarketPremium.js');
  const serviceText = fs.readFileSync(servicePath, 'utf8');
  assert.match(serviceText, /buildPremiumFeedSignals/);
  assert.match(serviceText, /buildPremiumDetailActions/);
  assert.doesNotMatch(serviceText.toLowerCase(), new RegExp([['ya','ndex'].join(''), ['yaa','ndex'].join(''), ['yan','go'].join('')].join('|')));

  const touched = [
    'src/modules/client/features/auto-market/pages/FeedPage.jsx',
    'src/modules/client/features/auto-market/pages/DetailsPage.jsx',
    'src/modules/client/features/auto-market/components/Create/CreateAdWizard.jsx',
    'src/modules/client/features/auto-market/components/Details/SellerProfile.jsx',
  ];

  for (const rel of touched) {
    const text = fs.readFileSync(path.join(root, rel), 'utf8').toLowerCase();
    assert.doesNotMatch(text, new RegExp([['ya','ndex'].join(''), ['yaa','ndex'].join(''), ['yan','go'].join('')].join('|')));
  }
});
