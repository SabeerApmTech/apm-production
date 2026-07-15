export interface NotificationItem {
  notificationId: number
  title: string
  message: string
  notificationType: string
  module: string
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
  module?: string
}

export interface NotificationCounts {
  all: number
  unread: number
  read: number
}
