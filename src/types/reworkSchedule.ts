import type { PriorityLevel } from "@/shared/constants"

export type ReworkType = "CustomerService" | "ReworkFromStore" | "InhouseRework"

/** Wire shape from GET /api/ReworkPendingSchedule — dates are ISO here, converted to display format on fetch. */
export interface RawReworkPendingScheduleRecord {
  reworkPendingScheduleId: number
  priorityNo: number
  priorityLevel: PriorityLevel
  reworkScheduleDate: string
  reworkScheduleId: string
  reworkScheduleNumber: number
  reworkScheduleYear: number
  reworkType: ReworkType
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

export interface ReworkPendingScheduleRecord {
  /** Alias of reworkPendingScheduleId, kept only so the shared EditDeleteCell renderer (which reads `data.id`) works unmodified. */
  id: number
  reworkPendingScheduleId: number
  priorityNo: number
  priorityLevel: PriorityLevel
  /** Display format (DD/MM/YYYY) — converted from the API's ISO date on fetch. */
  reworkScheduleDate: string
  reworkScheduleId: string
  reworkScheduleNumber: number
  reworkScheduleYear: number
  reworkType: ReworkType
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

export interface CreateReworkPendingScheduleRequest {
  reworkScheduleDate: string
  reworkType: ReworkType
  companyName: string
  companyLocation: string
  productName: string
  targetQty: number
  targetDate: string
  priorityLevel: PriorityLevel
  createdByEmpId: string
}

export interface UpdateReworkPendingScheduleRequest {
  reworkScheduleId: string
  reworkScheduleDate: string
  targetQty: number
  targetDate: string
  priorityLevel: PriorityLevel
  updatedByEmpId: string
}

export interface UpdateReworkPriorityRequest {
  reworkPendingScheduleId: number
  priorityNo: number
}

export interface DeleteReworkPendingScheduleRequest {
  reworkPendingScheduleId: number
  deletedByEmpId: string
}

/** Wire shape from GET /api/ReworkCompletedSchedule — dates are ISO here, kept as-is for client-side date-range filtering. */
export interface ReworkCompletedScheduleRecord {
  reworkScheduleDate: string
  reworkScheduleId: string
  reworkScheduleYear: number
  reworkType: ReworkType
  companyName: string
  productName: string
  noOfOperations: number
  targetQty: number
  targetDate: string
  completedAt: string
  createdByEmpName: string
}
