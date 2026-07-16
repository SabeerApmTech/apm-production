import { api, unwrap } from "../api"
import type { ApiResponse } from "@/types/auth"
import type {
  GetNotificationsParams,
  GetNotificationsResponse,
  NotificationCounts,
  NotificationSetting,
} from "@/types/notification"

export const notificationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<GetNotificationsResponse, GetNotificationsParams>({
      query: ({ employeeId, isRead, category }) => ({
        url: "/notifications",
        params: {
          employeeId,
          ...(isRead !== undefined ? { IsRead: isRead } : {}),
          ...(category ? { Category: category } : {}),
        },
      }),
      transformResponse: unwrap,
      providesTags: ["Notification"],
    }),
    getNotificationCounts: builder.query<NotificationCounts, string>({
      query: (employeeId) => ({ url: "/notifications/counts", params: { employeeId } }),
      transformResponse: unwrap,
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
    getNotificationSettings: builder.query<NotificationSetting[], string>({
      query: (employeeId) => ({ url: "/notifications/settings", params: { employeeId } }),
      transformResponse: unwrap,
      providesTags: ["NotificationSettings"],
    }),
    updateNotificationSetting: builder.mutation<ApiResponse<null>, { notificationSettingId: number; isActive: boolean }>({
      query: ({ notificationSettingId, isActive }) => ({
        url: `/notifications/settings/${notificationSettingId}`,
        method: "PUT",
        body: { isActive },
      }),
      invalidatesTags: ["NotificationSettings"],
    }),
  }),
})

export const {
  useGetNotificationsQuery,
  useGetNotificationCountsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useClearAllNotificationsMutation,
  useGetNotificationSettingsQuery,
  useUpdateNotificationSettingMutation,
} = notificationApi
