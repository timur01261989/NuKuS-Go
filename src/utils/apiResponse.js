export function isApiOk(response) {
  return !!(response && (response.ok === true || response.success === true || response.order || response.data || response.id));
}

export function extractOrder(response) {
  if (!response) return null;
  if (response.order && typeof response.order === 'object') return response.order;
  if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) return response.data;
  if (response.id || response.orderId) return response;
  return null;
}

export function extractOrderId(response) {
  const order = extractOrder(response);
  return String(
    order?.id ?? response?.orderId ?? response?.id ?? response?.data?.id ?? ''
  ).trim() || null;
}

export function extractApiError(error) {
  return error?.data?.error || error?.message || 'Server error';
}
