import * as cityTaxiApi from "@/features/driver/city-taxi/services/cityTaxiApi";
import * as freightApi from "@/features/driver/freight/services/freightApi";
import * as integrationApi from "@/features/driver/delivery-integration/services/integrationApi";
import * as districtApi from "@/features/driver/inter-district/services/districtApi";
import * as interProvincialApi from "@/features/driver/inter-provincial/services/interProvincialApi";

export {
  cityTaxiApi,
  freightApi,
  integrationApi,
  districtApi,
  interProvincialApi,
};

export default {
  ...cityTaxiApi,
  ...freightApi,
  ...integrationApi,
  ...districtApi,
  ...interProvincialApi,
};
