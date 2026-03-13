import * as walletApi from "@/services/walletApi";
import * as checkoutApi from "@/services/checkoutApi";
import * as promoApi from "@/services/promoApi";

export { walletApi, checkoutApi, promoApi };
export default { ...walletApi, ...checkoutApi, ...promoApi };
