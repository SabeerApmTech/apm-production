import { api } from "../api"
import type { ApiResponse } from "@/types/auth"
import type {
  CreateReworkPendingScheduleRequest,
  RawReworkPendingScheduleRecord,
  ReworkPendingScheduleRecord,
  UpdateReworkPendingScheduleRequest,
  UpdateReworkPriorityRequest,
} from "@/types/reworkSchedule"
import { fromIsoDate } from "@/utils/date"

export const reworkPendingScheduleApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getReworkPendingSchedules: builder.query<ReworkPendingScheduleRecord[], void>({
      query: () => "/ReworkPendingSchedule",
      transformResponse: (res: ApiResponse<RawReworkPendingScheduleRecord[]>) =>
        res.data.map((s) => ({
          ...s,
          id: s.reworkPendingScheduleId,
          reworkScheduleDate: fromIsoDate(s.reworkScheduleDate),
          targetDate: fromIsoDate(s.targetDate),
        })),
      providesTags: [{ type: "ReworkSchedule", id: "LIST" }],
    }),
    createReworkPendingSchedule: builder.mutation<ApiResponse<RawReworkPendingScheduleRecord>, CreateReworkPendingScheduleRequest>({
      query: (body) => ({ url: "/ReworkPendingSchedule", method: "POST", body }),
      invalidatesTags: [{ type: "ReworkSchedule", id: "LIST" }],
    }),
    updateReworkPendingSchedule: builder.mutation<ApiResponse<RawReworkPendingScheduleRecord>, UpdateReworkPendingScheduleRequest>({
      query: (body) => ({ url: "/ReworkPendingSchedule", method: "PUT", body }),
      invalidatesTags: [{ type: "ReworkSchedule", id: "LIST" }],
    }),
    deleteReworkPendingSchedule: builder.mutation<ApiResponse<null>, number>({
      query: (reworkPendingScheduleId) => ({
        url: "/ReworkPendingSchedule",
        method: "DELETE",
        body: { reworkPendingScheduleId },
      }),
      invalidatesTags: [{ type: "ReworkSchedule", id: "LIST" }],
    }),
    updateReworkPendingSchedulePriority: builder.mutation<ApiResponse<null>, UpdateReworkPriorityRequest[]>({
      query: (body) => ({ url: "/ReworkPendingSchedule/update-priority", method: "PUT", body }),
      invalidatesTags: [{ type: "ReworkSchedule", id: "LIST" }],
    }),
  }),
})

export const {
  useGetReworkPendingSchedulesQuery,
  useCreateReworkPendingScheduleMutation,
  useUpdateReworkPendingScheduleMutation,
  useDeleteReworkPendingScheduleMutation,
  useUpdateReworkPendingSchedulePriorityMutation,
} = reworkPendingScheduleApi
