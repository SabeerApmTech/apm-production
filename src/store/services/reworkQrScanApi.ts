import { api, unwrap } from "../api"
import type { ApiResponse } from "@/types/auth"
import type {
  ReworkCurrentSessionDetail,
  ReworkQrScanBulkRequest,
  ReworkScanHistoryEntry,
} from "@/types/productionMonitoring"

function reworkScanCountTag(params: { employeeId: string; scheduleId: string; operationName: string }) {
  return { type: "ReworkQrScanCount" as const, id: `${params.scheduleId}:${params.operationName}:${params.employeeId}` }
}

function reworkSessionScanTag(reworkTransactionLogId: number) {
  return { type: "ReworkQrScanCount" as const, id: `session:${reworkTransactionLogId}` }
}

export const reworkQrScanApi = api.injectEndpoints({
  endpoints: (builder) => ({
    saveReworkQrScan: builder.mutation<
      ApiResponse<null>,
      ReworkQrScanBulkRequest & {
        /** Client-side only — not sent to the backend, just used to invalidate the scan count/session tags below. */
        employeeId: string; scheduleId: string; operationName: string; currentTransactionLogId?: number
      }
    >({
      query: ({ reworkTransactionLogId, uniqueIdentifiers }) => ({
        url: "/rework-qr-scan",
        method: "POST",
        body: { reworkTransactionLogId, uniqueIdentifiers },
      }),
      invalidatesTags: (_result, _error, arg) => [
        reworkScanCountTag(arg),
        ...(arg.currentTransactionLogId != null ? [reworkSessionScanTag(arg.currentTransactionLogId)] : []),
      ],
    }),
    getReworkEmployeeScanHistory: builder.query<
      ReworkScanHistoryEntry[],
      { employeeId: string; scheduleId: string; operationName: string }
    >({
      query: (params) => ({ url: "/rework-qr-scan/employee-scan-history", params }),
      transformResponse: unwrap,
      providesTags: (_result, _error, arg) => [reworkScanCountTag(arg)],
    }),
    // Keyed by the current (possibly still-open) session's reworkTransactionLogId — the rework
    // counterpart of operationQrScanApi's getCurrentSessionScans.
    getReworkCurrentSessionScans: builder.query<ReworkCurrentSessionDetail, number>({
      query: (reworkTransactionLogId) => `/rework-qr-scan/current-session/${reworkTransactionLogId}`,
      transformResponse: unwrap,
      providesTags: (_result, _error, reworkTransactionLogId) => [reworkSessionScanTag(reworkTransactionLogId)],
    }),
  }),
})

export const {
  useSaveReworkQrScanMutation,
  useGetReworkEmployeeScanHistoryQuery,
  useGetReworkCurrentSessionScansQuery,
} = reworkQrScanApi
