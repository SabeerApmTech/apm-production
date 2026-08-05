import { api, unwrap } from "../api"
import type { ApiResponse } from "@/types/auth"
import type {
  EmployeeScanHistory,
  OperationQrScanBulkRequest,
} from "@/types/productionMonitoring"
import type { ReworkType } from "@/types/reworkSchedule"
import type {
  ProducedProductsResponse,
  QrCurrentSessionDetail,
  ScannedRecordDetail,
  ScannedRecordsResponse,
} from "@/types/qrScanRecords"

function scanCountTag(params: { employeeId: string; scheduleId: string; scheduleOperationId: number }) {
  return { type: "OperationQrScanCount" as const, id: `${params.scheduleId}:${params.scheduleOperationId}:${params.employeeId}` }
}

function sessionScanTag(transactionLogId: number) {
  return { type: "OperationQrScanCount" as const, id: `session:${transactionLogId}` }
}

export const operationQrScanApi = api.injectEndpoints({
  endpoints: (builder) => ({
    saveBulkOperationQrScan: builder.mutation<
      ApiResponse<null>,
      OperationQrScanBulkRequest & {
        /** Client-side only — not sent to the backend, just used to invalidate the scan count/session tags below. */
        employeeId: string; scheduleId: string; scheduleOperationId: number; currentTransactionLogId?: number
      }
    >({
      query: ({ transactionLogId, identifiers }) => ({
        url: "/operation-qr-scan/save-bulk",
        method: "POST",
        body: { transactionLogId, identifiers },
      }),
      invalidatesTags: (_result, _error, arg) => [
        scanCountTag(arg),
        ...(arg.currentTransactionLogId != null ? [sessionScanTag(arg.currentTransactionLogId)] : []),
      ],
    }),
    getEmployeeScanHistory: builder.query<
      EmployeeScanHistory,
      { employeeId: string; scheduleId: string; scheduleOperationId: number; operationName: string; reworkType: ReworkType | null }
    >({
      query: ({ employeeId, scheduleId, operationName }) => ({
        url: "/operation-qr-scan/employee-scan-history",
        params: { employeeId, scheduleId, operationName },
      }),
      transformResponse: unwrap,
      providesTags: (_result, _error, arg) => [scanCountTag(arg)],
    }),
    // Keyed by the current (possibly still-open) session's transactionLogId — every log entry
    // from START onward carries the same id, so this reflects the QR codes scanned specifically
    // during that one Start-to-Stop session, as opposed to the schedule/operation's running total
    // from getEmployeeScanHistory.
    getCurrentSessionScans: builder.query<
      QrCurrentSessionDetail,
      { transactionLogId: number; reworkType: ReworkType | null }
    >({
      query: ({ transactionLogId, reworkType }) => ({
        url: "/operation-qr-scan/current-session",
        params: { transactionLogId, reworkType: reworkType ?? undefined },
      }),
      transformResponse: unwrap,
      providesTags: (_result, _error, arg) => [sessionScanTag(arg.transactionLogId)],
    }),
    getProducedProducts: builder.query<ProducedProductsResponse, void>({
      query: () => "/operation-qr-scan/scanned-products",
      transformResponse: unwrap,
    }),
    getScannedRecords: builder.query<ScannedRecordsResponse, { fromDate: string; toDate: string }>({
      query: ({ fromDate, toDate }) => ({
        url: "/operation-qr-scan/scanned-records",
        params: { fromDate, toDate },
      }),
      transformResponse: unwrap,
    }),
    getScannedRecordsFilter: builder.query<
      ScannedRecordsResponse,
      { companyName?: string; productName?: string; operationName?: string; employeeId?: string }
    >({
      query: ({ companyName, productName, operationName, employeeId }) => ({
        url: "/operation-qr-scan/scanned-records-filter",
        params: {
          CompanyName: companyName,
          ProductName: productName,
          OperationName: operationName,
          EmployeeId: employeeId,
        },
      }),
      transformResponse: unwrap,
    }),
    getScannedRecordDetails: builder.query<
      ScannedRecordDetail,
      { scheduleId: string; employeeId: string; operationName: string }
    >({
      query: (params) => ({
        url: "/operation-qr-scan/scanned-record-details",
        params,
      }),
      transformResponse: unwrap,
    }),
  }),
})

export const {
  useSaveBulkOperationQrScanMutation,
  useGetEmployeeScanHistoryQuery,
  useGetCurrentSessionScansQuery,
  useGetProducedProductsQuery,
  useGetScannedRecordsQuery,
  useGetScannedRecordsFilterQuery,
  useGetScannedRecordDetailsQuery,
} = operationQrScanApi
