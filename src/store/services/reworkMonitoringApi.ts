import { api, unwrap } from "../api"
import type { ApiResponse } from "@/types/auth"
import type {
  LogReportResponse,
  OperationRecord,
  OperatorActionRequest,
  OperatorSchedule,
  RawLogReportResponse,
} from "@/types/productionMonitoring"

export const reworkMonitoringApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getOperatorReworkSchedules: builder.query<OperatorSchedule[], string>({
      query: (employeeId) => ({ url: "/Rework/operator-rework-schedules", params: { employeeId } }),
      transformResponse: unwrap,
    }),
    getOperatorReworkOperations: builder.query<OperationRecord[], { employeeId: string; scheduleId: string }>({
      query: (params) => ({ url: "/Rework/operator-rework-operations", params }),
      transformResponse: unwrap,
    }),
    getOperatorReworkLogReport: builder.query<LogReportResponse, { employeeId: string; scheduleId: string; sequenceNo: number }>({
      query: (params) => ({ url: "/Rework/operator-rework-log-report", params }),
      // The backend returns a bare `[]` instead of the {activeHours, idleHours, logs} shape
      // when there are no logs yet — normalize that here so callers only ever see one shape.
      transformResponse: (res: ApiResponse<RawLogReportResponse>) =>
        Array.isArray(res.data) ? { activeHours: "0.00", idleHours: "0.00", logs: [] } : res.data,
      providesTags: (_result, _error, { scheduleId, sequenceNo }) => [
        { type: "ReworkMonitoringLog", id: `${scheduleId}:${sequenceNo}` },
      ],
    }),
    operatorReworkAction: builder.mutation<ApiResponse<null>, OperatorActionRequest>({
      query: (body) => ({ url: "/Rework/operator-rework-action", method: "POST", body }),
      invalidatesTags: (_result, _error, { scheduleId, sequenceNo }) => [
        { type: "ReworkMonitoringLog", id: `${scheduleId}:${sequenceNo}` },
      ],
    }),
  }),
})

export const {
  useGetOperatorReworkSchedulesQuery,
  useLazyGetOperatorReworkSchedulesQuery,
  useGetOperatorReworkOperationsQuery,
  useLazyGetOperatorReworkOperationsQuery,
  useGetOperatorReworkLogReportQuery,
  useLazyGetOperatorReworkLogReportQuery,
  useOperatorReworkActionMutation,
} = reworkMonitoringApi
