import { api } from "../api"
import type { ApiResponse } from "@/types/auth"
import type { GetNotificationsParams, GetNotificationsResponse, NotificationCounts } from "@/types/notification"

export const notificationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<GetNotificationsResponse, GetNotificationsParams>({
      query: ({ employeeId, isRead, module }) => ({
        url: "/notifications",
        params: {
          employeeId,
          ...(isRead !== undefined ? { IsRead: isRead } : {}),
          ...(module ? { Module: module } : {}),
        },
      }),
      transformResponse: (res: ApiResponse<GetNotificationsResponse>) => res.data,
      providesTags: ["Notification"],
    }),
    getNotificationCounts: builder.query<NotificationCounts, string>({
      query: (employeeId) => ({ url: "/notifications/counts", params: { employeeId } }),
      transformResponse: (res: ApiResponse<NotificationCounts>) => res.data,
      providesTags: ["Notification"],
    }),
    markNotificationRead: builder.mutation<ApiResponse<null>, number>({
      query: (notificationId) => ({ url: `/notifications/${notificationId}/mark-read`, method: "PUT" }),
      invalidatesTags: ["Notification"],
    }),
    markAllNotificationsRead: builder.mutation<ApiResponse<null>, string>({
      query: (employeeId) => ({ url: "/notifications/mark-all-read", method: "PUT", params: { employeeId } }),
      invalidatesTags: ["Notification"],
    }),
    clearAllNotifications: builder.mutation<ApiResponse<null>, string>({
      query: (employeeId) => ({ url: "/notifications/clear-all", method: "DELETE", params: { employeeId } }),
      invalidatesTags: ["Notification"],
    }),
  }),
})

export const {
  useGetNotificationsQuery,
  useGetNotificationCountsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useClearAllNotificationsMutation,
} = notificationApi
