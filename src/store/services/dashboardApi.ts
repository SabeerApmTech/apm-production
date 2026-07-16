import { api, unwrap } from "../api"
import type {
  EmployeeLiveTrackingResponse,
  EmployeeTrackingRow,
  EmployeeTrackingStatus,
  ScheduleLiveTrackingResponse,
} from "@/types/dashboard"

export const dashboardApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getEmployeeLiveTracking: builder.query<EmployeeLiveTrackingResponse, void>({
      query: () => "/Dashboard/employee-wise-live-tracking",
      transformResponse: unwrap,
    }),
    getEmployeeLiveTrackingByStatus: builder.query<EmployeeTrackingRow[], EmployeeTrackingStatus>({
      query: (status) => ({
        url: "/Dashboard/employee-wise-live-tracking-by-status",
        params: { Status: status },
      }),
      transformResponse: unwrap,
    }),
    getScheduleLiveTracking: builder.query<ScheduleLiveTrackingResponse, string>({
      query: (scheduleId) => ({
        url: "/Dashboard/schedule-wise-live-tracking",
        params: { ScheduleId: scheduleId },
      }),
      transformResponse: unwrap,
    }),
  }),
})

export const {
  useGetEmployeeLiveTrackingQuery,
  useGetEmployeeLiveTrackingByStatusQuery,
  useGetScheduleLiveTrackingQuery,
} = dashboardApi
