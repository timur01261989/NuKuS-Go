import React, { memo } from 'react';
import UnifiedWalletPage from '@/modules/shared/components/UnifiedWalletPage.jsx';
import { useLanguage } from '@/modules/shared/i18n/useLanguage.js';

const DriverWalletPage = memo(function DriverWalletPage() {
  const { tr } = useLanguage();

  return (
    <UnifiedWalletPage
      homePath="/driver"
      title={tr('wallet', 'Hamyon')}
      roleLabel={tr('workAsDriver', 'Haydovchi')}
      referralPath="/driver/referral"
      demoTopupAmount={10000}
    />
  );
});

export default DriverWalletPage;
