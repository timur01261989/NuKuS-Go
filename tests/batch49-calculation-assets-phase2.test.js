
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

test('batch49 calculation phase2 touch points import calculation asset layer', () => {
  const files = [
    'src/modules/client/features/client/pages/ClientWallet.jsx',
    'src/modules/client/features/client/pages/ClientPaymentMethods.jsx',
    'src/modules/client/features/payments/PaymentsModule.jsx',
    'src/modules/client/features/client/components/PaymentStatus.jsx',
  ];
  for (const rel of files) {
    assert.match(read(rel), /calculationAssets/);
  }
});

test('batch49 calculation phase2 wires pricing and payment visuals into payment surfaces', () => {
  const wallet = read('src/modules/client/features/client/pages/ClientWallet.jsx');
  const methods = read('src/modules/client/features/client/pages/ClientPaymentMethods.jsx');
  const paymentsModule = read('src/modules/client/features/payments/PaymentsModule.jsx');
  const paymentStatus = read('src/modules/client/features/client/components/PaymentStatus.jsx');

  assert.match(wallet, /pricingMoments|paymentInsights|calculationAssets\.payment\.details/);
  assert.match(methods, /pricingHints|calculationAssets\.pricing\.surgeUp|calculationAssets\.payment\.card/);
  assert.match(paymentsModule, /pricingCards|calculationAssets\.pricing\.fair|calculationAssets\.pricing\.down/);
  assert.match(paymentStatus, /pricingIcon|calculationAssets\.pricing\.surgeUp|calculationAssets\.payment\.details/);
});

test('batch49 changed files report exists', () => {
  assert.equal(fs.existsSync(path.join(root, 'BATCH49_CHANGED_FILES.txt')), true);
});
