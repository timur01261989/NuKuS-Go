/** Share ride link helper (UI integration in parent) */
export function buildShareLink(orderId) {
  const base = window.location.origin;
  return `${base}/track/${encodeURIComponent(orderId)}`;
}
