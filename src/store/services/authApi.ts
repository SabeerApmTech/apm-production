import { api } from "../api"
import type {
  ApiResponse,
  AuthUser,
  ChangePasswordRequest,
  LoginRequest,
} from "@/types/auth"

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<ApiResponse<AuthUser>, LoginRequest>({
      query: (body) => ({
        url: "/Authentication/login",
        method: "POST",
        body,
      }),
    }),
    logout: builder.mutation<ApiResponse<null>, void>({
      query: () => ({
        url: "/Authentication/logout",
        method: "POST",
      }),
    }),
    resetPassword: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({
        url: `/Authentication/reset-password/${id}`,
        method: "PUT",
      }),
    }),
    changePassword: builder.mutation<
      ApiResponse<null>,
      { id: number; body: ChangePasswordRequest }
    >({
      query: ({ id, body }) => ({
        url: `/Authentication/change-password/${id}`,
        method: "PUT",
        body,
      }),
    }),
  }),
})

export const {
  useLoginMutation,
  useLogoutMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
} = authApi
