import { api } from "../api"
import type { ApiResponse } from "@/types/auth"
import type {
  ProductionHistoryLogRecord,
  ProductionHistoryOperationRecord,
  ProductionHistoryScheduleRecord,
} from "@/types/productionHistory"

export const productionHistoryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProductionHistory: builder.query<
      ProductionHistoryScheduleRecord[],
      { fromDate?: string; toDate?: string } | void
    >({
      query: (params) => {
        const query: Record<string, string> = {}
        if (params?.fromDate) query.FromDate = params.fromDate
        if (params?.toDate) query.ToDate = params.toDate
        return { url: "/reports/production-history", params: query }
      },
      transformResponse: (res: ApiResponse<ProductionHistoryScheduleRecord[]>) => res.data,
    }),
    getProductionHistoryOperations: builder.query<ProductionHistoryOperationRecord[], string>({
      query: (scheduleId) => `/reports/production-history/${scheduleId}/operations`,
      transformResponse: (res: ApiResponse<ProductionHistoryOperationRecord[]>) => res.data,
    }),
    getProductionHistoryLogs: builder.query<
      ProductionHistoryLogRecord[],
      { scheduleId: string; sequenceNo: number }
    >({
      query: ({ scheduleId, sequenceNo }) => `/reports/production-history/${scheduleId}/operations/${sequenceNo}/logs`,
      transformResponse: (res: ApiResponse<ProductionHistoryLogRecord[]>) => res.data,
    }),
  }),
})

export const {
  useGetProductionHistoryQuery,
  useGetProductionHistoryOperationsQuery,
  useGetProductionHistoryLogsQuery,
} = productionHistoryApi
