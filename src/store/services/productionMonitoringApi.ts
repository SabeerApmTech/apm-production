import { api, unwrap } from "../api"
import type { ApiResponse } from "@/types/auth"
import type {
  LogReportResponse,
  OperationRecord,
  OperatorActionRequest,
  OperatorSchedule,
  RawLogReportResponse,
} from "@/types/productionMonitoring"

export const productionMonitoringApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getOperatorSchedules: builder.query<OperatorSchedule[], string>({
      query: (employeeId) => ({ url: "/ProductionMonitoring/operator-schedules", params: { employeeId } }),
      transformResponse: unwrap,
    }),
    getOperatorOperations: builder.query<OperationRecord[], { employeeId: string; scheduleId: string }>({
      query: (params) => ({ url: "/ProductionMonitoring/operator-operations", params }),
      transformResponse: unwrap,
    }),
    getOperatorLogReport: builder.query<LogReportResponse, { employeeId: string; scheduleId: string; sequenceNo: number }>({
      query: (params) => ({ url: "/ProductionMonitoring/operator-log-report", params }),
      // The backend returns a bare `[]` instead of the {activeHours, idleHours, logs} shape
      // when there are no logs yet — normalize that here so callers only ever see one shape.
      transformResponse: (res: ApiResponse<RawLogReportResponse>) =>
        Array.isArray(res.data) ? { activeHours: "0.00", idleHours: "0.00", logs: [] } : res.data,
      providesTags: (_result, _error, { scheduleId, sequenceNo }) => [
        { type: "ProductionMonitoringLog", id: `${scheduleId}:${sequenceNo}` },
      ],
    }),
    operatorAction: builder.mutation<ApiResponse<null>, OperatorActionRequest>({
      query: (body) => ({ url: "/ProductionMonitoring/operator-action", method: "POST", body }),
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
