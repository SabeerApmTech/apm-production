import { api, unwrap } from "../api"
import type { CompletedScheduleRecord } from "@/types/completedSchedule"

export const completedScheduleApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCompletedSchedules: builder.query<CompletedScheduleRecord[], { fromDate?: string; toDate?: string } | void>({
      query: (params) => ({ url: "/CompletedSchedule", params: params ?? undefined }),
      transformResponse: unwrap,
      providesTags: [{ type: "CompletedSchedule", id: "LIST" }],
    }),
  }),
})

export const { useGetCompletedSchedulesQuery } = completedScheduleApi
