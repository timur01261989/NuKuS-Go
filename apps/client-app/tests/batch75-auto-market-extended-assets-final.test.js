import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

test('batch75 extended assets final files exist', () => {
  const files = [
    'src/assets/auto-market/extended/signals/signal-qr-entry.svg',
    'src/assets/auto-market/extended/signals/signal-barcode-entry.png',
    'src/assets/auto-market/extended/signals/signal-compare-assist.png',
    'src/assets/auto-market/extended/signals/signal-price-drop-alt.webp',
    'src/assets/auto-market/extended/signals/signal-vin-tip-alt.webp',
    'src/assets/auto-market/extended/signals/signal-ev-europe.webp',
  ];
  for (const file of files) {
    assert.equal(fs.existsSync(path.join(root, file)), true, file);
  }
});

test('batch75 extended signals service exports final helpers', () => {
  const service = fs.readFileSync(path.join(root, 'src/modules/client/features/auto-market/services/autoMarketExtendedSignals.js'), 'utf8');
  for (const needle of ['buildQrAssistCards', 'buildCompareAssistRail', 'buildDealerActionTiles', 'buildNotificationRuleBoosts']) {
    assert.equal(service.includes(needle), true, needle);
  }
});

test('batch75 pages use final helper signals', () => {
  const checks = [
    ['src/modules/client/features/auto-market/pages/PaymentReceiptPage.jsx', 'buildQrAssistCards'],
    ['src/modules/client/features/auto-market/pages/ComparePage.jsx', 'buildCompareAssistRail'],
    ['src/modules/client/features/auto-market/pages/DealerProfilePage.jsx', 'buildDealerActionTiles'],
    ['src/modules/client/features/auto-market/pages/NotificationRulesPage.jsx', 'buildNotificationRuleBoosts'],
  ];
  for (const [file, needle] of checks) {
    const text = fs.readFileSync(path.join(root, file), 'utf8');
    assert.equal(text.includes(needle), true, `${file} -> ${needle}`);
  }
});
