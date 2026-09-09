import { api, unwrap } from "../api"
import { fromIsoDate } from "@/utils/date"
import type { PriorityLevel } from "@/shared/constants"
import type { ApiResponse } from "@/types/auth"
import type {
  CloseOpenScheduleRequest,
  ConsumeStockRequest,
  CreateOpenScheduleRequest,
  OpenScheduleOperation,
  OpenScheduleRecord,
  UpdateOpenScheduleRequest,
  UpdateOpenSchedulePriorityRequest,
  UpdateToProduceRequest,
} from "@/types/openSchedule"

const basePath = "/OpenSchedule"
const scheduleList = { type: "OpenSchedule" as const, id: "LIST" }
// Reuses the same tag the existing staffAllocationApi's allocateStaff mutation already
// invalidates (keyed by schedule id) — so allocating a team for one of this schedule's
// operations busts this schedule's operations cache too, with no changes needed there.
const operationsTag = (openScheduleId: number) => ({ type: "ScheduleOperations" as const, id: openScheduleId })

// The API's priorityLevel is upper-cased ("LOW"/"MEDIUM"/"HIGH"); the rest of the app (PriorityBadge,
// PRIORITY_STYLES, the radio group on the form) works in Title Case — normalize at the edges instead
// of teaching every consumer both casings.
function toDisplayPriority(raw: string): PriorityLevel {
  const titleCase = (raw.charAt(0) + raw.slice(1).toLowerCase()) as PriorityLevel
  return titleCase
}

export const openScheduleApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getOpenSchedules: builder.query<OpenScheduleRecord[], void>({
      query: () => basePath,
      transformResponse: (res: ApiResponse<OpenScheduleRecord[]>) =>
        res.data.map((s) => ({
          ...s,
          priorityLevel: toDisplayPriority(s.priorityLevel),
          scheduleDate: fromIsoDate(s.scheduleDate),
          targetDate: fromIsoDate(s.targetDate),
        })),
      providesTags: [scheduleList],
    }),
    createOpenSchedule: builder.mutation<ApiResponse<OpenScheduleRecord>, CreateOpenScheduleRequest>({
      query: (body) => ({ url: basePath, method: "POST", body: { ...body, priorityLevel: body.priorityLevel.toUpperCase() } }),
      invalidatesTags: [scheduleList],
    }),
    updateOpenSchedule: builder.mutation<ApiResponse<OpenScheduleRecord>, UpdateOpenScheduleRequest>({
      query: (body) => ({ url: basePath, method: "PUT", body: { ...body, priorityLevel: body.priorityLevel.toUpperCase() } }),
      invalidatesTags: [scheduleList],
    }),
    deleteOpenSchedule: builder.mutation<ApiResponse<null>, number>({
      query: (openScheduleId) => ({ url: `${basePath}/${openScheduleId}`, method: "DELETE" }),
      invalidatesTags: [scheduleList],
    }),
    getOpenScheduleOperations: builder.query<OpenScheduleOperation[], number>({
      query: (openScheduleId) => `${basePath}/get-operations-of-schedule/${openScheduleId}`,
      transformResponse: unwrap,
      providesTags: (_result, _error, openScheduleId) => [operationsTag(openScheduleId)],
    }),
    closeOpenSchedule: builder.mutation<ApiResponse<null>, CloseOpenScheduleRequest>({
      query: (body) => ({ url: `${basePath}/close`, method: "PUT", body }),
      invalidatesTags: [scheduleList],
    }),
    updateOpenSchedulePriority: builder.mutation<ApiResponse<null>, UpdateOpenSchedulePriorityRequest>({
      query: (body) => ({ url: `${basePath}/update-priority`, method: "PUT", body }),
      invalidatesTags: [scheduleList],
    }),
    consumeScheduleStock: builder.mutation<ApiResponse<null>, ConsumeStockRequest & { openScheduleId: number }>({
      // `openScheduleId` only drives which cache entry to invalidate below — it isn't part of
      // the request body, so the query builder sends just the three fields the endpoint expects.
      query: (arg) => ({
        url: `${basePath}/consume-stock`, method: "POST",
        body: { scheduleOperationId: arg.scheduleOperationId, consumeStockQty: arg.consumeStockQty, updatedByEmpId: arg.updatedByEmpId },
      }),
      invalidatesTags: (_result, _error, { openScheduleId }) => [operationsTag(openScheduleId), scheduleList],
    }),
    updateScheduleToProduce: builder.mutation<ApiResponse<null>, UpdateToProduceRequest & { openScheduleId: number }>({
      query: (arg) => ({
        url: `${basePath}/update-to-produce`, method: "PUT",
        body: { scheduleOperationId: arg.scheduleOperationId, toProduceQty: arg.toProduceQty, updatedByEmpId: arg.updatedByEmpId },
      }),
      invalidatesTags: (_result, _error, { openScheduleId }) => [operationsTag(openScheduleId)],
    }),
  }),
})

export const {
  useGetOpenSchedulesQuery,
  useCreateOpenScheduleMutation,
  useUpdateOpenScheduleMutation,
  useDeleteOpenScheduleMutation,
  useGetOpenScheduleOperationsQuery,
  useCloseOpenScheduleMutation,
  useUpdateOpenSchedulePriorityMutation,
  useConsumeScheduleStockMutation,
  useUpdateScheduleToProduceMutation,
} = openScheduleApi
