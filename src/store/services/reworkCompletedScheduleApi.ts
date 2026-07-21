import { api, unwrap } from "../api"
import type { ReworkCompletedScheduleRecord } from "@/types/reworkSchedule"

export const reworkCompletedScheduleApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getReworkCompletedSchedules: builder.query<ReworkCompletedScheduleRecord[], { fromDate?: string; toDate?: string } | void>({
      query: (params) => ({ url: "/ReworkCompletedSchedule", params: params ?? undefined }),
      transformResponse: unwrap,
      providesTags: [{ type: "ReworkCompletedSchedule", id: "LIST" }],
    }),
  }),
})

export const { useGetReworkCompletedSchedulesQuery } = reworkCompletedScheduleApi
