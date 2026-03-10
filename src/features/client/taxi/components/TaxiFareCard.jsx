import React, { memo } from 'react';

function TaxiFareCard({ children }) {
  return <>{children}</>;
}

export default memo(TaxiFareCard);
