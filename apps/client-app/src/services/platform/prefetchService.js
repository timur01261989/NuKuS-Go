export function makeChunkPrefetcher(loader) {
  let started = false;

  return () => {
    if (started) return;
    started = true;

    try {
      void loader();
    } catch {
      // noop
    }
  };
}

export const prefetch = {
  taxi: makeChunkPrefetcher(() => import("../../modules/client/pages/TaxiOrder.jsx")),
  freight: makeChunkPrefetcher(() => import("../../modules/client/pages/FreightOrder.jsx")),
  intercity: makeChunkPrefetcher(() => import("../../modules/client/pages/IntercityOrder.jsx")),
  interDistrict: makeChunkPrefetcher(() => import("../../modules/client/pages/InterdistrictOrder.jsx")),
  delivery: makeChunkPrefetcher(() => import("../../modules/client/pages/DeliveryOrder.jsx")),
  wallet: makeChunkPrefetcher(() => import("../../modules/client/pages/Wallet.jsx")),
  referral: makeChunkPrefetcher(() => import("../../modules/client/pages/Referral.jsx")),
};

export default prefetch;
