import { api } from "../api"
import type { ApiResponse } from "@/types/auth"
import type { CompletedScheduleRecord } from "@/types/completedSchedule"

export const completedScheduleApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCompletedSchedules: builder.query<CompletedScheduleRecord[], void>({
      query: () => "/CompletedSchedule",
      transformResponse: (res: ApiResponse<CompletedScheduleRecord[]>) => res.data,
      providesTags: [{ type: "CompletedSchedule", id: "LIST" }],
    }),
  }),
})

export const { useGetCompletedSchedulesQuery } = completedScheduleApi
