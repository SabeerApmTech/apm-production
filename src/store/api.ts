import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL ?? "/api",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token")
      if (token) {
        headers.set("Authorization", `Bearer ${token}`)
      }
      return headers
    },
  }),
  tagTypes: ["UserList", "Product", "ProductOperations", "Company", "PendingSchedule", "TransactionLog", "ScheduleOperations", "ProductionMonitoringLog", "CompletedSchedule", "HandoverToStore", "Store"],
  endpoints: () => ({}),
})
