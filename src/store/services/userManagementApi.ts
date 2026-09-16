import { api, unwrap } from "../api"
import type { ApiResponse } from "@/types/auth"
import type {
  CreateUserRequest,
  ManagedRole,
  UpdateUserRequest,
  UpdateUserStatusRequest,
  UserRecord,
} from "@/types/userManagement"

export const userManagementApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getManagers: builder.query<UserRecord[], void>({
      query: () => "/UserManagement/managers",
      transformResponse: unwrap,
      providesTags: [{ type: "UserList", id: "MANAGER" }],
    }),
    getSupervisors: builder.query<UserRecord[], void>({
      query: () => "/UserManagement/supervisors",
      transformResponse: unwrap,
      providesTags: [{ type: "UserList", id: "SUPERVISOR" }],
    }),
    getOperators: builder.query<UserRecord[], void>({
      query: () => "/UserManagement/operators",
      transformResponse: unwrap,
      providesTags: [{ type: "UserList", id: "OPERATOR" }],
    }),
    getUserByEmployeeId: builder.query<UserRecord, string>({
      query: (employeeId) => `/UserManagement/${encodeURIComponent(employeeId)}`,
      transformResponse: unwrap,
    }),
    createUser: builder.mutation<ApiResponse<UserRecord>, CreateUserRequest>({
      query: (body) => ({
        url: "/UserManagement",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [{ type: "UserList", id: arg.employeeRole }],
    }),
    updateUser: builder.mutation<
      ApiResponse<UserRecord>,
      { employeeId: string; role: ManagedRole; body: UpdateUserRequest }
    >({
      query: ({ employeeId, body }) => ({
        url: `/UserManagement/${encodeURIComponent(employeeId)}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [{ type: "UserList", id: arg.role }],
    }),
    deleteUsers: builder.mutation<
      ApiResponse<null>,
      { userIds: number[]; role: ManagedRole; deletedByEmployeeId: string }
    >({
      query: ({ userIds, deletedByEmployeeId }) => ({
        url: "/UserManagement",
        method: "DELETE",
        body: { userIds, deletedByEmployeeId },
      }),
      invalidatesTags: (_result, _error, arg) => [{ type: "UserList", id: arg.role }],
    }),
    // PUT /UserManagement/{id}/status doesn't exist on the backend (ProductionTrackerApplication.API)
    // — and the general PUT /UserManagement/{id} it might otherwise go through has no status/isActive
    // field either (its UpdateUser body only covers name/DOB/employment type/phone), so there's
    // currently no way to persist this at all. Disabled via a queryFn that resolves to an honest
    // error (surfaced by the toast middleware) instead of hitting a route that would 404.
    updateUserStatus: builder.mutation<
      ApiResponse<null>,
      { employeeId: string; role: ManagedRole; body: UpdateUserStatusRequest }
    >({
      // query: ({ employeeId, body }) => ({
      //   url: `/UserManagement/${encodeURIComponent(employeeId)}/status`,
      //   method: "PUT",
      //   body,
      // }),
      queryFn: async () => ({
        error: { status: "CUSTOM_ERROR", error: "Not available", data: { success: false, message: "Changing employee status isn't available yet." } },
      }),
      invalidatesTags: (_result, _error, arg) => [{ type: "UserList", id: arg.role }],
    }),
  }),
})

export const {
  useGetManagersQuery,
  useGetSupervisorsQuery,
  useGetOperatorsQuery,
  useGetUserByEmployeeIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUsersMutation,
  useUpdateUserStatusMutation,
} = userManagementApi
