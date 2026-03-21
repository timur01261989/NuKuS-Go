export * as cityTaxiApi from "@/modules/driver/legacy/city-taxi/services/cityTaxiApi";
export * as freightApi from "@/modules/driver/legacy/freight/services/freightApi";
export * as integrationApi from "@/modules/driver/legacy/delivery-integration/services/integrationApi";
export * as districtApi from "@/modules/driver/legacy/inter-district/services/districtApi";
export * as interProvincialApi from "@/modules/driver/legacy/inter-provincial/services/interProvincialApi";

import * as cityTaxiApi from "@/modules/driver/legacy/city-taxi/services/cityTaxiApi";
import * as freightApi from "@/modules/driver/legacy/freight/services/freightApi";
import * as integrationApi from "@/modules/driver/legacy/delivery-integration/services/integrationApi";
import * as districtApi from "@/modules/driver/legacy/inter-district/services/districtApi";
import * as interProvincialApi from "@/modules/driver/legacy/inter-provincial/services/interProvincialApi";

const dispatchService = {
  ...cityTaxiApi,
  ...freightApi,
  ...integrationApi,
  ...districtApi,
  ...interProvincialApi,
};

export default dispatchService;
