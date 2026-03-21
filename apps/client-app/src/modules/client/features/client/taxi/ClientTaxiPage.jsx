import React, { memo } from "react";
import ClientTaxiPageImpl from "./ClientTaxiPage.impl";

function ClientTaxiPage() {
  return <ClientTaxiPageImpl />;
}

export default memo(ClientTaxiPage);
