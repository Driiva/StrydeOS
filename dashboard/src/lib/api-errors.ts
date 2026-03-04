/**
 * Maps API auth/error responses to user-friendly messages.
 * Use when displaying API errors (e.g. toasts) so users don't see raw "Invalid token".
 */
export function getApiErrorMessage(
  status: number,
  serverMessage?: string | null
): string | null {
  if (status === 401) return "Session expired. Please sign in again.";
  const msg = (serverMessage ?? "").toLowerCase();
  if (
    /invalid token|missing.*authorization|unauthorized|session expired/i.test(msg)
  ) {
    return "Session expired. Please sign in again.";
  }
  return null;
}

/**
 * Returns the message to show for an API error response.
 * Prefers a friendly auth message for 401/token errors; otherwise returns serverMessage or fallback.
 */
export function normalizeApiError(
  status: number,
  serverMessage?: string | null,
  fallback = "Something went wrong. Please try again."
): string {
  return getApiErrorMessage(status, serverMessage) ?? serverMessage ?? fallback;
}
