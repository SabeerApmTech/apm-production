import { api, unwrap } from "../api"
import type { ApiResponse } from "@/types/auth"
import type {
  CreateHandoverRequest,
  HandoverPendingRecord,
  HandoverTransactionRecord,
} from "@/types/handoverToStore"

export const handoverToStoreApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getHandoverPendingList: builder.query<HandoverPendingRecord[], void>({
      query: () => "/HandoverToStore/HandoverPendingList",
      transformResponse: unwrap,
      providesTags: [{ type: "HandoverToStore", id: "PENDING_LIST" }],
    }),
    getHandoverTransactionLog: builder.query<HandoverTransactionRecord[], { fromDate?: string; toDate?: string }>({
      query: (params) => ({ url: "/HandoverToStore/transaction-log", params }),
      transformResponse: (res: ApiResponse<HandoverTransactionRecord[]>) =>
        res.data.map((t) => ({ ...t, id: t.handoverId })),
      providesTags: [{ type: "HandoverToStore", id: "LOG" }],
    }),
    createHandover: builder.mutation<ApiResponse<null>, CreateHandoverRequest>({
      query: (body) => ({ url: "/HandoverToStore", method: "POST", body }),
      invalidatesTags: [
        { type: "HandoverToStore", id: "PENDING_LIST" },
        { type: "HandoverToStore", id: "LOG" },
      ],
    }),
    deleteHandover: builder.mutation<ApiResponse<null>, { handoverId: number; employeeId: string }>({
      query: ({ handoverId, employeeId }) => ({
        url: `/HandoverToStore/${handoverId}`,
        method: "DELETE",
        params: { employeeId },
      }),
      invalidatesTags: [
        { type: "HandoverToStore", id: "PENDING_LIST" },
        { type: "HandoverToStore", id: "LOG" },
      ],
    }),
  }),
})

export const {
  useGetHandoverPendingListQuery,
  useGetHandoverTransactionLogQuery,
  useCreateHandoverMutation,
  useDeleteHandoverMutation,
} = handoverToStoreApi
