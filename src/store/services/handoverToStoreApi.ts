import { api, unwrap } from "../api"
import type { ApiResponse } from "@/types/auth"
import type { CreateHandoverRequest, HandoverTransactionRecord, PendingHandoverRecord } from "@/types/handoverToStore"

const basePath = "/HandoverToStore"
const pendingList = { type: "HandoverToStore" as const, id: "LIST" }
const detailTag = (scheduleId: string) => ({ type: "HandoverToStore" as const, id: scheduleId })
const logList = { type: "HandoverToStore" as const, id: "LOG" }

export const handoverToStoreApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPendingHandovers: builder.query<PendingHandoverRecord[], void>({
      query: () => `${basePath}/pending`,
      transformResponse: unwrap,
      providesTags: [pendingList],
    }),
    // Fetched right before the handover dialog opens, so the qty the user confirms against is
    // fresh rather than whatever the list happened to show when it was last fetched.
    getPendingHandoverDetail: builder.query<PendingHandoverRecord, string>({
      query: (scheduleId) => `${basePath}/pending/${scheduleId}`,
      transformResponse: unwrap,
      providesTags: (_result, _error, scheduleId) => [detailTag(scheduleId)],
    }),
    createHandover: builder.mutation<ApiResponse<null>, CreateHandoverRequest>({
      query: (body) => ({ url: `${basePath}/handover`, method: "POST", body }),
      invalidatesTags: (_result, _error, { scheduleId }) => [pendingList, detailTag(scheduleId), logList],
    }),
    getHandoverTransactionLog: builder.query<HandoverTransactionRecord[], { fromDate?: string; toDate?: string }>({
      query: (params) => ({ url: `${basePath}/transaction-log`, params }),
      transformResponse: (res: ApiResponse<HandoverTransactionRecord[]>) =>
        res.data.map((t) => ({ ...t, id: t.handoverId })),
      providesTags: [logList],
    }),
    deleteHandover: builder.mutation<ApiResponse<null>, { handoverId: number; employeeId: string }>({
      query: ({ handoverId, employeeId }) => ({
        url: `${basePath}/${handoverId}`,
        method: "DELETE",
        params: { employeeId },
      }),
      invalidatesTags: [pendingList, logList],
    }),
  }),
})

export const {
  useGetPendingHandoversQuery,
  useGetPendingHandoverDetailQuery,
  useCreateHandoverMutation,
  useGetHandoverTransactionLogQuery,
  useDeleteHandoverMutation,
} = handoverToStoreApi
