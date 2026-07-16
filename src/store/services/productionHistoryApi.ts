import { api, unwrap } from "../api"
import type {
  ProductionHistoryLogRecord,
  ProductionHistoryOperationRecord,
  ProductionHistoryScheduleRecord,
} from "@/types/productionHistory"

export const productionHistoryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProductionHistory: builder.query<
      ProductionHistoryScheduleRecord[],
      { fromDate?: string; toDate?: string; companyName?: string; productName?: string } | void
    >({
      query: (params) => {
        const query: Record<string, string> = {}
        if (params?.fromDate) query.FromDate = params.fromDate
        if (params?.toDate) query.ToDate = params.toDate
        if (params?.companyName) query.CompanyName = params.companyName
        if (params?.productName) query.ProductName = params.productName
        return { url: "/reports/production-history", params: query }
      },
      transformResponse: unwrap,
    }),
    getProductionHistoryOperations: builder.query<ProductionHistoryOperationRecord[], string>({
      query: (scheduleId) => `/reports/production-history/${scheduleId}/operations`,
      transformResponse: unwrap,
    }),
    getProductionHistoryLogs: builder.query<
      ProductionHistoryLogRecord[],
      { scheduleId: string; sequenceNo: number }
    >({
      query: ({ scheduleId, sequenceNo }) => `/reports/production-history/${scheduleId}/operations/${sequenceNo}/logs`,
      transformResponse: unwrap,
    }),
  }),
})

export const {
  useGetProductionHistoryQuery,
  useGetProductionHistoryOperationsQuery,
  useGetProductionHistoryLogsQuery,
} = productionHistoryApi
