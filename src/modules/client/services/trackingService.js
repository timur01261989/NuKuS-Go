import * as ordersRealtime from "@/services/ordersRealtime";
import * as ordersApi from "@/services/ordersApi";

export { ordersRealtime, ordersApi };
export default { ...ordersRealtime, ...ordersApi };
