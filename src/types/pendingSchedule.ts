import type { PriorityLevel } from "@/shared/constants"

/** Wire shape from GET /api/PendingSchedule — dates are ISO here, converted to display format on fetch. */
export interface RawPendingScheduleRecord {
  pendingScheduleId: number
  priorityNo: number
  priorityLevel: PriorityLevel
  scheduleDate: string
  scheduleId: string
  scheduleNumber: number
  scheduleYear: number
  companyName: string
  companyLocation: string
  productName: string
  noOfOperations: number
  targetQty: number
  producedQty: number
  pendingQty: number | null
  targetDate: string
  createdByEmpId: string
  createdByEmpName: string
  staffAllocationStatus: string
  createdAt: string
  updatedAt: string
  averageOutputPerDay: number
  projectedDate: string | null
}

export interface PendingScheduleRecord {
  /** Alias of pendingScheduleId, kept only so the shared EditDeleteCell renderer (which reads `data.id`) works unmodified. */
  id: number
  pendingScheduleId: number
  priorityNo: number
  priorityLevel: PriorityLevel
  /** Display format (DD/MM/YYYY) — converted from the API's ISO date on fetch. */
  scheduleDate: string
  scheduleId: string
  scheduleNumber: number
  scheduleYear: number
  companyName: string
  companyLocation: string
  productName: string
  noOfOperations: number
  targetQty: number
  producedQty: number
  pendingQty: number | null
  /** Display format (DD/MM/YYYY) — converted from the API's ISO date on fetch. */
  targetDate: string
  createdByEmpId: string
  createdByEmpName: string
  staffAllocationStatus: string
  createdAt: string
  updatedAt: string
  averageOutputPerDay: number
  projectedDate: string | null
}

export interface CreatePendingScheduleRequest {
  scheduleDate: string
  companyName: string
  companyLocation: string
  productName: string
  targetQty: number
  targetDate: string
  priorityLevel: PriorityLevel
  createdByEmpId: string
}

export interface UpdatePendingScheduleRequest {
  scheduleId: string
  scheduleDate: string
  targetQty: number
  targetDate: string
  priorityLevel: PriorityLevel
}

export interface UpdatePriorityRequest {
  pendingScheduleId: number
  priorityNo: number
}
