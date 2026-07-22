import { api } from "../api"
import type { ApiResponse } from "@/types/auth"
import type {
  CreatePendingScheduleRequest,
  DeletePendingScheduleRequest,
  PendingScheduleRecord,
  RawPendingScheduleRecord,
  UpdatePendingScheduleRequest,
  UpdatePriorityRequest,
} from "@/types/pendingSchedule"
import { fromIsoDate } from "@/utils/date"

export const pendingScheduleApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPendingSchedules: builder.query<PendingScheduleRecord[], void>({
      query: () => "/PendingSchedule",
      transformResponse: (res: ApiResponse<RawPendingScheduleRecord[]>) =>
        res.data.map((s) => ({
          ...s,
          id: s.pendingScheduleId,
          scheduleDate: fromIsoDate(s.scheduleDate),
          targetDate: fromIsoDate(s.targetDate),
        })),
      providesTags: [{ type: "PendingSchedule", id: "LIST" }],
    }),
    createPendingSchedule: builder.mutation<ApiResponse<RawPendingScheduleRecord>, CreatePendingScheduleRequest>({
      query: (body) => ({ url: "/PendingSchedule", method: "POST", body }),
      invalidatesTags: [{ type: "PendingSchedule", id: "LIST" }],
    }),
    updatePendingSchedule: builder.mutation<ApiResponse<RawPendingScheduleRecord>, UpdatePendingScheduleRequest>({
      query: (body) => ({ url: "/PendingSchedule", method: "PUT", body }),
      invalidatesTags: [{ type: "PendingSchedule", id: "LIST" }],
    }),
    deletePendingSchedule: builder.mutation<ApiResponse<null>, DeletePendingScheduleRequest>({
      query: (body) => ({
        url: "/PendingSchedule",
        method: "DELETE",
        body,
      }),
      invalidatesTags: [{ type: "PendingSchedule", id: "LIST" }],
    }),
    updatePendingSchedulePriority: builder.mutation<ApiResponse<null>, UpdatePriorityRequest[]>({
      query: (body) => ({ url: "/PendingSchedule/update-priority", method: "PUT", body }),
      invalidatesTags: [{ type: "PendingSchedule", id: "LIST" }],
    }),
  }),
})

export const {
  useGetPendingSchedulesQuery,
  useCreatePendingScheduleMutation,
  useUpdatePendingScheduleMutation,
  useDeletePendingScheduleMutation,
  useUpdatePendingSchedulePriorityMutation,
} = pendingScheduleApi
