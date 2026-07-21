import { api, unwrap } from "../api"
import type { ApiResponse } from "@/types/auth"
import type {
  ReworkAllocatedStaffMember,
  ReworkLastTeamMember,
  ReworkOperationStepRecord,
  ReworkStaffAllocationRequest,
} from "@/types/reworkStaffAllocation"

export const reworkStaffAllocationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getReworkOperationsBySchedule: builder.query<ReworkOperationStepRecord[], number>({
      query: (reworkPendingScheduleId) => `/ReworkPendingSchedule/get-operations-of-schedule/${reworkPendingScheduleId}`,
      transformResponse: unwrap,
      providesTags: (_result, _error, reworkPendingScheduleId) => [
        { type: "ReworkScheduleOperations", id: reworkPendingScheduleId },
      ],
    }),
    getReworkAllocatedStaff: builder.query<ReworkAllocatedStaffMember[], number>({
      query: (reworkScheduleOperationId) => `/ReworkStaffAllocation/${reworkScheduleOperationId}`,
      transformResponse: unwrap,
      providesTags: (_result, _error, reworkScheduleOperationId) => [
        { type: "ReworkScheduleOperations", id: `staff-${reworkScheduleOperationId}` },
      ],
    }),
    // Not transformed — the component needs `message` to show a "no previous team" notice when `data` is empty.
    getReworkLastAssignedTeam: builder.query<ApiResponse<ReworkLastTeamMember[]>, number>({
      query: (reworkScheduleOperationId) => `/ReworkStaffAllocation/fetch-last-team/${reworkScheduleOperationId}`,
    }),
    allocateReworkStaff: builder.mutation<ApiResponse<null>, ReworkStaffAllocationRequest & { reworkPendingScheduleId: number }>({
      query: (arg) => ({
        url: "/ReworkStaffAllocation",
        method: "POST",
        body: {
          reworkScheduleOperationId: arg.reworkScheduleOperationId,
          employeeIds: arg.employeeIds,
          allocatedByEmpId: arg.allocatedByEmpId,
        },
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "ReworkScheduleOperations", id: arg.reworkPendingScheduleId },
        { type: "ReworkScheduleOperations", id: `staff-${arg.reworkScheduleOperationId}` },
        { type: "ReworkSchedule", id: "LIST" },
      ],
    }),
  }),
})

export const {
  useGetReworkOperationsByScheduleQuery,
  useGetReworkAllocatedStaffQuery,
  useLazyGetReworkLastAssignedTeamQuery,
  useAllocateReworkStaffMutation,
} = reworkStaffAllocationApi
