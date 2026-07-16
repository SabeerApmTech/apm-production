export interface NotificationItem {
  notificationId: number
  title: string
  message: string
  notificationType: string
  category: string
  referenceId: string
  isRead: boolean
  readAt: string | null
  createdAt: string
  navigationUrl: string | null
  navigationId: string | null
}

export interface GetNotificationsResponse {
  totalRecords: number
  notifications: NotificationItem[]
}

export interface GetNotificationsParams {
  employeeId: string
  isRead?: boolean
  category?: string
}

export interface NotificationCounts {
  all: number
  unread: number
  read: number
}

export interface NotificationSetting {
  notificationSettingId: number
  notificationEventId: number
  category: string
  eventType: string
  isActive: boolean
}
