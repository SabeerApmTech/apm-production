import { api } from "../api"
import type {
  DashboardScheduleOption,
  EmployeeLiveTrackingResponse,
  EmployeeTrackingRow,
  EmployeeTrackingStatus,
  ScheduleLiveTrackingResponse,
} from "@/types/dashboard"

// The backend (ProductionTrackerApplication.API) has no Dashboard controller at all — none of
// these /Dashboard/* routes exist. Every endpoint below is disabled via a queryFn that resolves
// to an empty result instead of making a real request, so Live Tracking renders its normal empty
// state rather than a permanent error. Reinstate the commented-out `query` once the backend adds
// a Dashboard controller.
export const dashboardApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getEmployeeLiveTracking: builder.query<EmployeeLiveTrackingResponse, void>({
      // query: () => "/Dashboard/employee-wise-live-tracking",
      // transformResponse: unwrap,
      queryFn: async () => ({
        data: { summary: { totalEmployees: 0, notStarted: 0, running: 0, paused: 0, stopped: 0 }, employees: [] },
      }),
    }),
    getEmployeeLiveTrackingByStatus: builder.query<EmployeeTrackingRow[], EmployeeTrackingStatus>({
      // query: (status) => ({
      //   url: "/Dashboard/employee-wise-live-tracking-by-status",
      //   params: { Status: status },
      // }),
      // transformResponse: unwrap,
      queryFn: async () => ({ data: [] }),
    }),
    getScheduleLiveTracking: builder.query<ScheduleLiveTrackingResponse, string>({
      // query: (scheduleId) => ({
      //   url: "/Dashboard/schedule-wise-live-tracking",
      //   params: { ScheduleId: scheduleId },
      // }),
      // transformResponse: unwrap,
      queryFn: async () => ({
        data: {
          header: {
            scheduleDate: "", targetDate: "", projectedDate: null, companyName: "", productName: "",
            targetQty: 0, producedQty: 0, pendingQty: 0, averageOutputPerDay: 0, scheduleType: "PRODUCTION",
          },
          operations: [],
        },
      }),
    }),
    getDashboardSchedules: builder.query<DashboardScheduleOption[], void>({
      // query: () => "/Dashboard/schedules",
      // transformResponse: unwrap,
      queryFn: async () => ({ data: [] }),
    }),
  }),
})

export const {
  useGetEmployeeLiveTrackingQuery,
  useGetEmployeeLiveTrackingByStatusQuery,
  useGetScheduleLiveTrackingQuery,
  useGetDashboardSchedulesQuery,
} = dashboardApi
