import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

test('security final touch points import security asset layer', () => {
  const files = [
    'src/modules/client/features/client/components/PaymentStatus.jsx',
    'src/modules/client/features/payments/PaymentsModule.jsx',
    'src/modules/client/features/client/pages/ClientProfile.jsx',
  ];
  for (const rel of files) {
    assert.match(read(rel), /securityAssets/);
  }
});

test('security final touch points wire trust scanner and state visuals', () => {
  const paymentStatus = read('src/modules/client/features/client/components/PaymentStatus.jsx');
  const paymentsModule = read('src/modules/client/features/payments/PaymentsModule.jsx');
  const profile = read('src/modules/client/features/client/pages/ClientProfile.jsx');

  assert.match(paymentStatus, /trustHumanVerified|securityLockFill|scanQrCode/);
  assert.match(paymentsModule, /paymentMethodUzcard|paymentMethodHumo|trustCertificate/);
  assert.match(profile, /authMaskSelfieDocument|securityRatingWarning|notifyBellUnread/);
});

test('vendor strings stay absent in final security touch points', () => {
  const files = [
    'src/modules/client/features/client/components/PaymentStatus.jsx',
    'src/modules/client/features/payments/PaymentsModule.jsx',
    'src/modules/client/features/client/pages/ClientProfile.jsx',
    'BATCH47_FINAL_CHANGED_FILES.txt',
  ];
  for (const rel of files) {
    const lower = read(rel).toLowerCase();
    assert.equal(lower.includes('vendor'), false, rel);
    assert.equal(lower.includes('vendor'), false, rel);
    assert.equal(lower.includes(String.fromCharCode(121, 97, 110, 103, 111)), false, rel);
  }
});
