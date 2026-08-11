/** Extracts a human-readable message from an RTK Query error, falling back when the response has no `message` field. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === "object" &&
    "data" in error &&
    error.data &&
    typeof error.data === "object" &&
    "message" in error.data &&
    typeof (error.data as { message?: unknown }).message === "string"
  ) {
    return (error.data as { message: string }).message
  }
  return fallback
}

interface BlockedOperator {
  operatorEmployeeId: string
  operatorName: string
  scheduleId: string
}

function isBlockedOperatorList(data: unknown): data is BlockedOperator[] {
  return Array.isArray(data) && data.length > 0 && data.every(
    (d) =>
      !!d && typeof d === "object" &&
      typeof (d as BlockedOperator).operatorEmployeeId === "string" &&
      typeof (d as BlockedOperator).scheduleId === "string"
  )
}

function isMissingIdentifiersPayload(data: unknown): data is { missingIdentifiers: string[] } {
  return !!data && typeof data === "object" &&
    Array.isArray((data as { missingIdentifiers?: unknown }).missingIdentifiers)
}

/**
 * Some failures (e.g. deleting an operator still assigned to a schedule operation) include a
 * `data` breakdown of exactly which records are blocking the request, alongside the main
 * `message`. Extracts that breakdown as a secondary detail line for display under the toast.
 */
export function getApiErrorDetails(error: unknown): string | undefined {
  if (
    error &&
    typeof error === "object" &&
    "data" in error &&
    error.data &&
    typeof error.data === "object" &&
    "data" in error.data
  ) {
    const inner = (error.data as { data?: unknown }).data
    if (isBlockedOperatorList(inner)) {
      return inner.map((o) => `${o.operatorName} (${o.operatorEmployeeId}) — ${o.scheduleId}`).join("\n")
    }
    if (isMissingIdentifiersPayload(inner)) {
      return `Not in Product List: ${inner.missingIdentifiers.join(", ")}`
    }
  }
  return undefined
}

/**
 * QR-scan save failures (e.g. POST /rework-qr-scan rejecting an identifier that isn't in the
 * Product List) include a `data.missingIdentifiers` breakdown alongside the main `message` —
 * extracts just those identifiers so the caller can highlight them in the pending-scan list.
 */
export function getMissingIdentifiers(error: unknown): string[] {
  if (
    error &&
    typeof error === "object" &&
    "data" in error &&
    error.data &&
    typeof error.data === "object" &&
    "data" in error.data
  ) {
    const inner = (error.data as { data?: unknown }).data
    if (isMissingIdentifiersPayload(inner)) return inner.missingIdentifiers
  }
  return []
}
