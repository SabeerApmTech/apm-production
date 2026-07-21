import { api, unwrap } from "../api"
import type {
  ReworkProductionHistoryLogRecord,
  ReworkProductionHistoryOperationRecord,
  ReworkProductionHistoryScheduleRecord,
} from "@/types/reworkProductionHistory"

export const reworkProductionHistoryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getReworkProductionHistory: builder.query<
      ReworkProductionHistoryScheduleRecord[],
      { fromDate?: string; toDate?: string; companyName?: string; productName?: string } | void
    >({
      query: (params) => {
        const query: Record<string, string> = {}
        if (params?.fromDate) query.FromDate = params.fromDate
        if (params?.toDate) query.ToDate = params.toDate
        if (params?.companyName) query.CompanyName = params.companyName
        if (params?.productName) query.ProductName = params.productName
        return { url: "/reports/rework-production-history", params: query }
      },
      transformResponse: unwrap,
    }),
    getReworkProductionHistoryOperations: builder.query<ReworkProductionHistoryOperationRecord[], string>({
      query: (reworkScheduleId) => `/reports/rework-production-history/${reworkScheduleId}/operations`,
      transformResponse: unwrap,
    }),
    getReworkProductionHistoryLogs: builder.query<
      ReworkProductionHistoryLogRecord[],
      { reworkScheduleId: string; sequenceNo: number }
    >({
      query: ({ reworkScheduleId, sequenceNo }) =>
        `/reports/rework-production-history/${reworkScheduleId}/operations/${sequenceNo}/logs`,
      transformResponse: unwrap,
    }),
  }),
})

export const {
  useGetReworkProductionHistoryQuery,
  useGetReworkProductionHistoryOperationsQuery,
  useGetReworkProductionHistoryLogsQuery,
} = reworkProductionHistoryApi
