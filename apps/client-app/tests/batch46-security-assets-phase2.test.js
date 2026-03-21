import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

test('security assets phase2 files import security asset layer', () => {
  const files = [
    'src/modules/client/features/auth/pages/Auth.jsx',
    'src/modules/client/features/auth/pages/Register.jsx',
    'src/modules/client/features/client/pages/ClientWallet.jsx',
    'src/modules/client/features/client/pages/ClientPaymentMethods.jsx',
    'src/modules/client/features/client/pages/ClientProfileDetails.jsx',
  ];

  for (const rel of files) {
    const content = read(rel);
    assert.match(content, /securityAssets/);
  }
});

test('security assets phase2 wires auth, payment, trust, scanner and notification visuals', () => {
  const auth = read('src/modules/client/features/auth/pages/Auth.jsx');
  const register = read('src/modules/client/features/auth/pages/Register.jsx');
  const wallet = read('src/modules/client/features/client/pages/ClientWallet.jsx');
  const methods = read('src/modules/client/features/client/pages/ClientPaymentMethods.jsx');
  const profile = read('src/modules/client/features/client/pages/ClientProfileDetails.jsx');

  assert.match(auth, /authIconPhone|authIconDocument|trustCertificate/);
  assert.match(register, /authMaskDocument|trustHumanVerified|notifyBellUnread/);
  assert.match(wallet, /paymentWalletFill|scanQrCode|trustCertificate/);
  assert.match(methods, /paymentWalletOutline|scanQrCode|notifyBellUnread/);
  assert.match(profile, /authMaskSelfieDocument|securityLockOutline|scanQr/);
});

test('vendor strings remain absent in security phase2 touch points', () => {
  const files = [
    'src/modules/client/features/auth/pages/Auth.jsx',
    'src/modules/client/features/auth/pages/Register.jsx',
    'src/modules/client/features/client/pages/ClientWallet.jsx',
    'src/modules/client/features/client/pages/ClientPaymentMethods.jsx',
    'src/modules/client/features/client/pages/ClientProfileDetails.jsx',
    'src/assets/security/security-assets-phase1.manifest.json',
    'BATCH45_CHANGED_FILES.txt',
  ];

  for (const rel of files) {
    const content = read(rel).toLowerCase();
    assert.equal(content.includes('vendor'), false, rel);
    assert.equal(content.includes('vendor'), false, rel);
    assert.equal(content.includes(String.fromCharCode(121, 97, 110, 103, 111)), false, rel);
  }
});
