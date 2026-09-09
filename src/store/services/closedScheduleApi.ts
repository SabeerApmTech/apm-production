import { api, unwrap } from "../api"
import type { ClosedScheduleRecord } from "@/types/closedSchedule"

export const closedScheduleApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getClosedSchedules: builder.query<ClosedScheduleRecord[], { fromDate?: string; toDate?: string } | void>({
      query: (params) => ({ url: "/ClosedSchedule", params: params ?? undefined }),
      transformResponse: unwrap,
      providesTags: [{ type: "ClosedSchedule", id: "LIST" }],
    }),
  }),
})

export const { useGetClosedSchedulesQuery } = closedScheduleApi
