import { osrmRoute } from "./osrmRoute.js";
import { premiumRoute } from "./premiumRoute.js";
import { googleRoute } from "./googleRoute.js";
import { snapNearestOSRM, snapToRoadOSRM } from "./osrmMatch.js";

export { googleRoute, premiumRoute, osrmRoute, snapNearestOSRM, snapToRoadOSRM };

function getProvider() {
  return String(import.meta?.env?.VITE_ROUTE_PROVIDER || "OSRM").trim().toUpperCase();
}

export async function buildRoute(options) {
  const provider = getProvider();
  if (provider === "PREMIUM") return premiumRoute(options);
  if (provider === "GOOGLE") return googleRoute(options);
  return osrmRoute(options);
}

export default buildRoute;
