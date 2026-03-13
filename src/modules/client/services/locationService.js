import * as geoService from "@/features/client/taxi/services/geoService";
import * as poiService from "@/services/poiService";

export { geoService, poiService };
export default { ...geoService, ...poiService };
