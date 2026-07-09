import { api } from "../api"
import type { ApiResponse } from "@/types/auth"
import type { RawTransactionLogRecord, TransactionLogRecord } from "@/types/transactionLog"

export const transactionLogApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTransactionLogs: builder.query<TransactionLogRecord[], { fromDate?: string; toDate?: string } | void>({
      query: (params) => ({ url: "/TransactionLog/transaction-logs", params: params ?? undefined }),
      transformResponse: (res: ApiResponse<RawTransactionLogRecord[]>) =>
        res.data.map((t) => ({ ...t, id: t.transactionLogId })),
      providesTags: [{ type: "TransactionLog", id: "LIST" }],
    }),
    deleteTransactionLog: builder.mutation<ApiResponse<null>, number>({
      query: (transactionId) => ({
        url: `/TransactionLog/${transactionId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "TransactionLog", id: "LIST" }],
    }),
  }),
})

export const {
  useGetTransactionLogsQuery,
  useDeleteTransactionLogMutation,
} = transactionLogApi
