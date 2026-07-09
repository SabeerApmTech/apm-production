import { api } from "../api"
import type { ApiResponse } from "@/types/auth"
import type {
  AllocatedStaffMember,
  LastTeamMember,
  OperationStepRecord,
  StaffAllocationRequest,
} from "@/types/staffAllocation"

export const staffAllocationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getOperationsBySchedule: builder.query<OperationStepRecord[], number>({
      query: (pendingScheduleId) => `/PendingSchedule/get-operations-of-schedule/${pendingScheduleId}`,
      transformResponse: (res: ApiResponse<OperationStepRecord[]>) => res.data,
      providesTags: (_result, _error, pendingScheduleId) => [
        { type: "ScheduleOperations", id: pendingScheduleId },
      ],
    }),
    getAllocatedStaff: builder.query<AllocatedStaffMember[], number>({
      query: (operationId) => `/StaffAllocation/${operationId}`,
      transformResponse: (res: ApiResponse<AllocatedStaffMember[]>) => res.data,
      providesTags: (_result, _error, operationId) => [
        { type: "ScheduleOperations", id: `staff-${operationId}` },
      ],
    }),
    // Not transformed — the component needs `message` to show a "no previous team" notice when `data` is empty.
    getLastAssignedTeam: builder.query<ApiResponse<LastTeamMember[]>, number>({
      query: (scheduleOperationId) => `/StaffAllocation/fetch-last-team/${scheduleOperationId}`,
    }),
    allocateStaff: builder.mutation<ApiResponse<null>, StaffAllocationRequest & { pendingScheduleId: number }>({
      query: (arg) => ({
        url: "/StaffAllocation",
        method: "POST",
        body: {
          scheduleOperationId: arg.scheduleOperationId,
          employeeIds: arg.employeeIds,
          allocatedByEmpId: arg.allocatedByEmpId,
        },
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "ScheduleOperations", id: arg.pendingScheduleId },
        { type: "ScheduleOperations", id: `staff-${arg.scheduleOperationId}` },
        { type: "PendingSchedule", id: "LIST" },
      ],
    }),
  }),
})

export const {
  useGetOperationsByScheduleQuery,
  useGetAllocatedStaffQuery,
  useLazyGetLastAssignedTeamQuery,
  useAllocateStaffMutation,
} = staffAllocationApi
