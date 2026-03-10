export function isApiOk(response) {
  if (!response) return false;

  if (response.ok === true) return true;
  if (response.success === true) return true;

  if (response.ok === false) return false;
  if (response.success === false) return false;

  if (response.error) return false;

  return true;
}

export function extractOrder(response) {
  if (!response || typeof response !== "object") return null;

  return (
    response.order ??
    response.data?.order ??
    response.data ??
    null
  );
}

export function extractOrderId(response) {
  if (!response || typeof response !== "object") return null;

  return (
    response.order?.id ??
    response.data?.order?.id ??
    response.data?.id ??
    response.id ??
    response.orderId ??
    null
  );
}

export function extractApiError(response) {
  if (!response) return "Unknown API error";

  return (
    response.error ??
    response.message ??
    response.data?.error ??
    response.data?.message ??
    ""
  );
}