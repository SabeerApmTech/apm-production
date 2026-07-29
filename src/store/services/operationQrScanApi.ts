import { api, unwrap } from "../api"
import type { ApiResponse } from "@/types/auth"
import type { EmployeeScanCount, OperationQrScanRequest } from "@/types/productionMonitoring"

function scanCountTag(params: { employeeId: string; scheduleId: string; scheduleOperationId: number }) {
  return { type: "OperationQrScanCount" as const, id: `${params.scheduleId}:${params.scheduleOperationId}:${params.employeeId}` }
}

export const operationQrScanApi = api.injectEndpoints({
  endpoints: (builder) => ({
    scanOperationQr: builder.mutation<ApiResponse<null>, OperationQrScanRequest>({
      query: (body) => ({ url: "/operation-qr-scan/scan", method: "POST", body }),
      invalidatesTags: (_result, _error, arg) => [scanCountTag(arg)],
    }),
    getEmployeeScanCount: builder.query<
      EmployeeScanCount,
      { employeeId: string; scheduleId: string; scheduleOperationId: number }
    >({
      query: (params) => ({ url: "/operation-qr-scan/employee-scan-count", params }),
      transformResponse: unwrap,
      providesTags: (_result, _error, arg) => [scanCountTag(arg)],
    }),
  }),
})

export const {
  useScanOperationQrMutation,
  useGetEmployeeScanCountQuery,
} = operationQrScanApi
