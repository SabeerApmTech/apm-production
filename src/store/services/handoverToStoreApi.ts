import { api, unwrap } from "../api"
import type { ApiResponse } from "@/types/auth"
import type { CreateHandoverRequest, PendingHandoverRecord } from "@/types/handoverToStore"

const basePath = "/HandoverToStore"
const pendingList = { type: "HandoverToStore" as const, id: "LIST" }
const detailTag = (scheduleId: string) => ({ type: "HandoverToStore" as const, id: scheduleId })

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
      invalidatesTags: (_result, _error, { scheduleId }) => [pendingList, detailTag(scheduleId)],
    }),
  }),
})

export const {
  useGetPendingHandoversQuery,
  useGetPendingHandoverDetailQuery,
  useCreateHandoverMutation,
} = handoverToStoreApi
