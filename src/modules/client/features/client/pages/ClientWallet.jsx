import React, { memo } from 'react';
import UnifiedWalletPage from '@/modules/shared/components/UnifiedWalletPage.jsx';
import { useLanguage } from '@/modules/shared/i18n/useLanguage.js';

const ClientWallet = memo(function ClientWallet() {
  const { tr } = useLanguage();

  return (
    <UnifiedWalletPage
      homePath="/client/home"
      title={tr('wallet', 'Hamyon')}
      roleLabel={tr('passenger', 'Yo‘lovchi')}
      referralPath="/client/referral"
      demoTopupAmount={10000}
    />
  );
});

export default ClientWallet;
