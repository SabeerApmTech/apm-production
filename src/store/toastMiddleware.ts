import { isFulfilled, isRejectedWithValue } from "@reduxjs/toolkit"
import type { Middleware, UnknownAction } from "@reduxjs/toolkit"
import { toast } from "sonner"
import { getApiErrorDetails, getApiErrorMessage } from "@/utils/apiError"

interface RtkQueryMeta {
  arg?: { type?: "query" | "mutation"; endpointName?: string }
}

function isMutation(action: UnknownAction): boolean {
  const meta = (action as { meta?: RtkQueryMeta }).meta
  return meta?.arg?.type === "mutation"
}

// Polling queries whose "not found" failures are an expected, momentary state rather than a
// real problem — e.g. schedule-wise live tracking keeps polling a schedule id that becomes
// stale the instant it's completed, right up until the page swaps to the next active schedule.
// Surfacing that as an error toast just confuses the manager/supervisor watching the dashboard.
const SILENT_QUERY_ENDPOINTS = new Set(["getScheduleLiveTracking"])

function isSilencedQuery(action: UnknownAction): boolean {
  const meta = (action as { meta?: RtkQueryMeta }).meta
  const endpointName = meta?.arg?.endpointName
  return !!endpointName && SILENT_QUERY_ENDPOINTS.has(endpointName)
}

/**
 * Surfaces every RTK Query API outcome as a toast: mutation successes show the
 * backend's own `message`, and any failed request (query or mutation) shows an
 * error — so add/edit/delete/toggle/login/etc. all get consistent feedback
 * without each call site wiring its own notification.
 */
export const toastMiddleware: Middleware = () => (next) => (action) => {
  const typedAction = action as UnknownAction

  if (isFulfilled(typedAction) && isMutation(typedAction)) {
    const message = (typedAction.payload as { message?: string } | undefined)?.message
    if (message) toast.success(message)
  } else if (isRejectedWithValue(typedAction) && !isSilencedQuery(typedAction)) {
    const message = getApiErrorMessage(typedAction.payload, "Something went wrong. Please try again.")
    const details = getApiErrorDetails(typedAction.payload)
    toast.error(message, details ? { description: details } : undefined)
  }

  return next(action)
}
