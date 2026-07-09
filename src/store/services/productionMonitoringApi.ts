import { api } from "../api"
import type { ApiResponse } from "@/types/auth"
import type {
  LogReportResponse,
  OperationRecord,
  OperatorActionRequest,
  OperatorSchedule,
} from "@/types/productionMonitoring"

export const productionMonitoringApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getOperatorSchedules: builder.query<OperatorSchedule[], string>({
      query: (employeeId) => ({ url: "/ProductionMonitoring/operator-schedules", params: { employeeId } }),
      transformResponse: (res: ApiResponse<OperatorSchedule[]>) => res.data,
    }),
    getOperatorOperations: builder.query<OperationRecord[], { employeeId: string; scheduleId: string }>({
      query: (params) => ({ url: "/ProductionMonitoring/operator-operations", params }),
      transformResponse: (res: ApiResponse<OperationRecord[]>) => res.data,
    }),
    getOperatorLogReport: builder.query<LogReportResponse, { employeeId: string; scheduleId: string; sequenceNo: number }>({
      query: (params) => ({ url: "/ProductionMonitoring/operator-log-report", params }),
      transformResponse: (res: ApiResponse<LogReportResponse>) => res.data,
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
  useLazyGetOperatorSchedulesQuery,
  useLazyGetOperatorOperationsQuery,
  useLazyGetOperatorLogReportQuery,
  useOperatorActionMutation,
} = productionMonitoringApi
