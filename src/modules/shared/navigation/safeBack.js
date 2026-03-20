export function safeBack(navigate, fallback = '/') {
  const hasHistory = typeof window !== 'undefined' && window.history && window.history.length > 1;

  if (hasHistory) {
    if (typeof navigate === 'function') {
      navigate(-1);
    } else if (typeof window !== 'undefined' && typeof window.history.back === 'function') {
      window.history.back();
    }
    return;
  }

  if (typeof navigate === 'function') {
    navigate(fallback, { replace: true });
    return;
  }

  if (typeof window !== 'undefined') {
    window.location.replace(fallback);
  }
}
