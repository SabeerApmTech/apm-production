import { api } from "../api"
import type { ApiResponse } from "@/types/auth"
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
      transformResponse: (res: ApiResponse<EmployeeLiveTrackingResponse>) => res.data,
    }),
    getEmployeeLiveTrackingByStatus: builder.query<EmployeeTrackingRow[], EmployeeTrackingStatus>({
      query: (status) => ({
        url: "/Dashboard/employee-wise-live-tracking-by-status",
        params: { Status: status },
      }),
      transformResponse: (res: ApiResponse<EmployeeTrackingRow[]>) => res.data,
    }),
    getScheduleLiveTracking: builder.query<ScheduleLiveTrackingResponse, string>({
      query: (scheduleId) => ({
        url: "/Dashboard/schedule-wise-live-tracking",
        params: { ScheduleId: scheduleId },
      }),
      transformResponse: (res: ApiResponse<ScheduleLiveTrackingResponse>) => res.data,
    }),
  }),
})

export const {
  useGetEmployeeLiveTrackingQuery,
  useGetEmployeeLiveTrackingByStatusQuery,
  useGetScheduleLiveTrackingQuery,
} = dashboardApi
