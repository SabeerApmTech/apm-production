import { api, unwrap } from "../api"
import type { ApiResponse } from "@/types/auth"
import type {
  LogReportEntry,
  LogReportResponse,
  OperationRecord,
  OperatorActionRequest,
  OperatorSchedule,
} from "@/types/productionMonitoring"

export const productionMonitoringApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getOperatorSchedules: builder.query<OperatorSchedule[], string>({
      query: (employeeId) => ({ url: "/Production/operator-production-schedules", params: { employeeId } }),
      transformResponse: unwrap,
    }),
    getOperatorOperations: builder.query<OperationRecord[], { employeeId: string; scheduleId: string }>({
      query: (params) => ({ url: "/Production/operator-production-operations", params }),
      transformResponse: unwrap,
    }),
    getOperatorLogReport: builder.query<LogReportResponse, { employeeId: string; scheduleId: string; sequenceNo: number }>({
      query: (params) => ({ url: "/Production/operator-production-log", params }),
      // The endpoint's own response is just a bare array of log entries, always — not the
      // {activeHours, idleHours, logs} shape its name suggests, and it doesn't return
      // activeHours/idleHours at all, so those are reported as unavailable here.
      transformResponse: (res: ApiResponse<LogReportEntry[]>) => ({
        activeHours: "0.00",
        idleHours: "0.00",
        logs: res.data,
      }),
      providesTags: (_result, _error, { scheduleId, sequenceNo }) => [
        { type: "ProductionMonitoringLog", id: `${scheduleId}:${sequenceNo}` },
      ],
    }),
    operatorAction: builder.mutation<ApiResponse<null>, OperatorActionRequest>({
      query: (body) => ({ url: "/Production/operator-production-action", method: "POST", body }),
      invalidatesTags: (_result, _error, { scheduleId, sequenceNo }) => [
        { type: "ProductionMonitoringLog", id: `${scheduleId}:${sequenceNo}` },
      ],
    }),
  }),
})

export const {
  useGetOperatorSchedulesQuery,
  useLazyGetOperatorSchedulesQuery,
  useGetOperatorOperationsQuery,
  useLazyGetOperatorOperationsQuery,
  useGetOperatorLogReportQuery,
  useLazyGetOperatorLogReportQuery,
  useOperatorActionMutation,
} = productionMonitoringApi
