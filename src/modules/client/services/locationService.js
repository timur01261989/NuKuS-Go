import * as geoService from "@/modules/client/features/client/taxi/services/geoService.js";
import * as poiService from "@/services/poiService";

export { geoService, poiService };
export default { ...geoService, ...poiService };
