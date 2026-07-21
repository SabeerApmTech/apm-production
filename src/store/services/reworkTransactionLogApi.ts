import { api } from "../api"
import type { ApiResponse } from "@/types/auth"
import type { RawReworkTransactionLogRecord, ReworkTransactionLogRecord } from "@/types/reworkTransactionLog"

export const reworkTransactionLogApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getReworkTransactionLogs: builder.query<
      ReworkTransactionLogRecord[],
      { fromDate?: string; toDate?: string; companyName?: string; productName?: string; operationName?: string } | void
    >({
      query: (params) => {
        const query: Record<string, string> = {}
        if (params?.fromDate) query.FromDate = params.fromDate
        if (params?.toDate) query.ToDate = params.toDate
        if (params?.companyName) query.CompanyName = params.companyName
        if (params?.productName) query.ProductName = params.productName
        if (params?.operationName) query.OperationName = params.operationName
        return { url: "/ReworkTransactionLog/transaction-logs", params: query }
      },
      transformResponse: (res: ApiResponse<RawReworkTransactionLogRecord[]>) =>
        res.data.map((t) => ({ ...t, id: t.reworkTransactionLogId })),
      providesTags: [{ type: "ReworkTransactionLog", id: "LIST" }],
    }),
    deleteReworkTransactionLog: builder.mutation<ApiResponse<null>, { transactionId: number; deletedByEmpId: string }>({
      query: ({ transactionId, deletedByEmpId }) => ({
        url: `/ReworkTransactionLog/${transactionId}`,
        method: "DELETE",
        params: { deletedByEmpId },
      }),
      invalidatesTags: [{ type: "ReworkTransactionLog", id: "LIST" }],
    }),
  }),
})

export const {
  useGetReworkTransactionLogsQuery,
  useDeleteReworkTransactionLogMutation,
} = reworkTransactionLogApi
