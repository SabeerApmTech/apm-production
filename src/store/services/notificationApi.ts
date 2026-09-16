import { api } from "../api"
import type { ApiResponse } from "@/types/auth"
import type {
  GetNotificationsParams,
  GetNotificationsResponse,
  NotificationCounts,
  NotificationSetting,
} from "@/types/notification"

const NOT_AVAILABLE = {
  error: { status: "CUSTOM_ERROR" as const, error: "Not available", data: { success: false, message: "Notifications aren't available yet." } },
}

// The backend (ProductionTrackerApplication.API) has no notifications controller at all — none of
// these /notifications/* routes exist. Every endpoint below is disabled via a queryFn: the two
// queries resolve to an empty result so the bell icon and Notifications page render their normal
// empty state, and the mutations resolve to an honest error (surfaced by the toast middleware)
// rather than a silent no-op. Reinstate the commented-out `query`/`transformResponse` once the
// backend adds one.
export const notificationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<GetNotificationsResponse, GetNotificationsParams>({
      // query: ({ employeeId, isRead, category }) => ({
      //   url: "/notifications",
      //   params: {
      //     employeeId,
      //     ...(isRead !== undefined ? { IsRead: isRead } : {}),
      //     ...(category ? { Category: category } : {}),
      //   },
      // }),
      // transformResponse: unwrap,
      queryFn: async () => ({ data: { totalRecords: 0, notifications: [] } }),
      providesTags: ["Notification"],
    }),
    getNotificationCounts: builder.query<NotificationCounts, string>({
      // query: (employeeId) => ({ url: "/notifications/counts", params: { employeeId } }),
      // transformResponse: unwrap,
      queryFn: async () => ({ data: { all: 0, unread: 0, read: 0 } }),
      providesTags: ["Notification"],
    }),
    markNotificationRead: builder.mutation<ApiResponse<null>, number>({
      // query: (notificationId) => ({ url: `/notifications/${notificationId}/mark-read`, method: "PUT" }),
      queryFn: async () => NOT_AVAILABLE,
      invalidatesTags: ["Notification"],
    }),
    markAllNotificationsRead: builder.mutation<ApiResponse<null>, string>({
      // query: (employeeId) => ({ url: "/notifications/mark-all-read", method: "PUT", params: { employeeId } }),
      queryFn: async () => NOT_AVAILABLE,
      invalidatesTags: ["Notification"],
    }),
    clearAllNotifications: builder.mutation<ApiResponse<null>, string>({
      // query: (employeeId) => ({ url: "/notifications/clear-all", method: "DELETE", params: { employeeId } }),
      queryFn: async () => NOT_AVAILABLE,
      invalidatesTags: ["Notification"],
    }),
    getNotificationSettings: builder.query<NotificationSetting[], string>({
      // query: (employeeId) => ({ url: "/notifications/settings", params: { employeeId } }),
      // transformResponse: unwrap,
      queryFn: async () => ({ data: [] }),
      providesTags: ["NotificationSettings"],
    }),
    updateNotificationSetting: builder.mutation<ApiResponse<null>, { notificationSettingId: number; isActive: boolean }>({
      // query: ({ notificationSettingId, isActive }) => ({
      //   url: `/notifications/settings/${notificationSettingId}`,
      //   method: "PUT",
      //   body: { isActive },
      // }),
      queryFn: async () => NOT_AVAILABLE,
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
