import { api, unwrap } from "../api"
import type { ApiResponse } from "@/types/auth"
import type { EmployeeScanHistory, OperationQrScanBulkRequest } from "@/types/productionMonitoring"

function scanCountTag(params: { employeeId: string; scheduleId: string; scheduleOperationId: number }) {
  return { type: "OperationQrScanCount" as const, id: `${params.scheduleId}:${params.scheduleOperationId}:${params.employeeId}` }
}

export const operationQrScanApi = api.injectEndpoints({
  endpoints: (builder) => ({
    saveBulkOperationQrScan: builder.mutation<ApiResponse<null>, OperationQrScanBulkRequest>({
      query: (body) => ({ url: "/operation-qr-scan/save-bulk", method: "POST", body }),
      invalidatesTags: (_result, _error, arg) => [scanCountTag(arg)],
    }),
    getEmployeeScanHistory: builder.query<
      EmployeeScanHistory,
      { employeeId: string; scheduleId: string; scheduleOperationId: number }
    >({
      query: (params) => ({ url: "/operation-qr-scan/employee-scan-history", params }),
      transformResponse: unwrap,
      providesTags: (_result, _error, arg) => [scanCountTag(arg)],
    }),
  }),
})

export const {
  useSaveBulkOperationQrScanMutation,
  useGetEmployeeScanHistoryQuery,
} = operationQrScanApi
