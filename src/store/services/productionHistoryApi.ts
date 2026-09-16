import { api } from "../api"
import type {
  ProductionHistoryLogRecord,
  ProductionHistoryOperationRecord,
  ProductionHistoryScheduleRecord,
} from "@/types/productionHistory"

// The backend (ProductionTrackerApplication.API) has no /reports/* controller at all — none of
// these routes exist. Every endpoint below is disabled via a queryFn that resolves to an empty
// result so the Production History page renders its normal empty state. Reinstate the
// commented-out `query` once the backend adds a reports endpoint.
export const productionHistoryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProductionHistory: builder.query<
      ProductionHistoryScheduleRecord[],
      { fromDate?: string; toDate?: string; companyName?: string; productName?: string } | void
    >({
      // query: (params) => {
      //   const query: Record<string, string> = {}
      //   if (params?.fromDate) query.FromDate = params.fromDate
      //   if (params?.toDate) query.ToDate = params.toDate
      //   if (params?.companyName) query.CompanyName = params.companyName
      //   if (params?.productName) query.ProductName = params.productName
      //   return { url: "/reports/production-history", params: query }
      // },
      // transformResponse: unwrap,
      queryFn: async () => ({ data: [] }),
    }),
    getProductionHistoryOperations: builder.query<ProductionHistoryOperationRecord[], string>({
      // query: (scheduleId) => `/reports/production-history/${scheduleId}/operations`,
      // transformResponse: unwrap,
      queryFn: async () => ({ data: [] }),
    }),
    getProductionHistoryLogs: builder.query<
      ProductionHistoryLogRecord[],
      { scheduleId: string; sequenceNo: number }
    >({
      // query: ({ scheduleId, sequenceNo }) => `/reports/production-history/${scheduleId}/operations/${sequenceNo}/logs`,
      // transformResponse: unwrap,
      queryFn: async () => ({ data: [] }),
    }),
  }),
})

export const {
  useGetProductionHistoryQuery,
  useGetProductionHistoryOperationsQuery,
  useGetProductionHistoryLogsQuery,
} = productionHistoryApi
