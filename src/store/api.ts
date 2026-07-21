import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import type { BaseQueryFn } from "@reduxjs/toolkit/query/react"
import { clearAuth, getLoginPath, getToken } from "@/utils/auth"
import type { ApiResponse } from "@/types/auth"

export const unwrap = <T,>(res: ApiResponse<T>): T => res.data

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? "/api",
  prepareHeaders: (headers) => {
    const token = getToken()
    if (token) {
      headers.set("Authorization", `Bearer ${token}`)
    }
    return headers
  },
})

// A 401 means the session's token is invalid or has expired server-side — drop the stale
// cookie/profile and send the user back to their login screen instead of leaving them stuck
// on a page where every request silently fails.
const baseQueryWithAuth: BaseQueryFn = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions)
  if (result.error?.status === 401) {
    const loginPath = getLoginPath()
    clearAuth()
    if (window.location.pathname !== loginPath) {
      window.location.assign(loginPath)
    }
  }
  return result
}

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["UserList", "Product", "ProductOperations", "Company", "PendingSchedule", "TransactionLog", "ReworkTransactionLog", "ScheduleOperations", "ProductionMonitoringLog", "ReworkMonitoringLog", "CompletedSchedule", "ReworkCompletedSchedule", "HandoverToStore", "ReworkHandoverToStore", "Store", "Notification", "NotificationSettings", "ReworkSchedule", "ReworkScheduleOperations"],
  endpoints: () => ({}),
})
