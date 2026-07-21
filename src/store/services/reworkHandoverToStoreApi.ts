import { api, unwrap } from "../api"
import type { ApiResponse } from "@/types/auth"
import type {
  CreateReworkHandoverRequest,
  ReworkHandoverPendingRecord,
  ReworkHandoverTransactionRecord,
} from "@/types/reworkHandoverToStore"

export const reworkHandoverToStoreApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getReworkHandoverPendingList: builder.query<ReworkHandoverPendingRecord[], void>({
      query: () => "/ReworkHandoverToStore/HandoverPendingList",
      transformResponse: unwrap,
      providesTags: [{ type: "ReworkHandoverToStore", id: "PENDING_LIST" }],
    }),
    getReworkHandoverTransactionLog: builder.query<ReworkHandoverTransactionRecord[], { fromDate?: string; toDate?: string }>({
      query: (params) => ({ url: "/ReworkHandoverToStore/transaction-log", params }),
      transformResponse: (res: ApiResponse<ReworkHandoverTransactionRecord[]>) =>
        res.data.map((t) => ({ ...t, id: t.reworkHandoverId })),
      providesTags: [{ type: "ReworkHandoverToStore", id: "LOG" }],
    }),
    createReworkHandover: builder.mutation<ApiResponse<null>, CreateReworkHandoverRequest>({
      query: (body) => ({ url: "/ReworkHandoverToStore", method: "POST", body }),
      invalidatesTags: [
        { type: "ReworkHandoverToStore", id: "PENDING_LIST" },
        { type: "ReworkHandoverToStore", id: "LOG" },
      ],
    }),
    deleteReworkHandover: builder.mutation<ApiResponse<null>, { handoverId: number; employeeId: string }>({
      query: ({ handoverId, employeeId }) => ({
        url: `/ReworkHandoverToStore/${handoverId}`,
        method: "DELETE",
        params: { employeeId },
      }),
      invalidatesTags: [
        { type: "ReworkHandoverToStore", id: "PENDING_LIST" },
        { type: "ReworkHandoverToStore", id: "LOG" },
      ],
    }),
  }),
})

export const {
  useGetReworkHandoverPendingListQuery,
  useGetReworkHandoverTransactionLogQuery,
  useCreateReworkHandoverMutation,
  useDeleteReworkHandoverMutation,
} = reworkHandoverToStoreApi
