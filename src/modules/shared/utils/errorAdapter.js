export function getErrorMessage(error, fallback = "Kutilmagan xatolik yuz berdi") {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  return (
    error.userMessage ||
    error.message ||
    error.error_description ||
    error.details ||
    fallback
  );
}

export function toUserError(error, fallback = "Xatolik yuz berdi") {
  const message = getErrorMessage(error, fallback);
  return new Error(message);
}


export function normalizeAppError(error, fallback = "Xatolik yuz berdi") {
  return {
    message: getErrorMessage(error, fallback),
    raw: error || null,
  };
}
