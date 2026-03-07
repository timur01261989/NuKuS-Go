export function safeBack(navigate, fallback = '/') {
  if (typeof window !== 'undefined' && window.history && window.history.length > 1) {
    navigate(-1);
    return;
  }
  navigate(fallback, { replace: true });
}
