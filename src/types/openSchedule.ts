import type { PriorityLevel } from "@/shared/constants"

export interface OpenScheduleRecord {
  openScheduleId: number
  priorityNo: number
  priorityLevel: PriorityLevel
  scheduleDate: string
  scheduleId: string
  scheduleNumber: number
  scheduleYear: number
  productCode: string
  companyName: string
  companyLocation: string
  state: string
  productName: string
  noOfOperations: number
  plannedQty: number
  targetDate: string
  isHandoverCompleted: boolean
  createdByEmpId: string
  createdByEmpName: string
  closeQty: number
  createdAt: string
  updatedAt: string
}

export interface CreateOpenScheduleRequest {
  scheduleDate: string
  priorityLevel: PriorityLevel
  productCode: string
  companyName: string
  companyLocation: string
  state: string
  productName: string
  plannedQty: number
  targetDate: string
  createdByEmpId: string
}

export interface UpdateOpenScheduleRequest {
  scheduleId: string
  scheduleDate: string
  productCode: string
  state: string
  plannedQty: number
  targetDate: string
  priorityLevel: PriorityLevel
  updatedByEmpId: string
}

export interface UpdateOpenSchedulePriorityItem {
  openScheduleId: number
  priorityNo: number
}

export interface UpdateOpenSchedulePriorityRequest {
  updatedByEmpId: string
  schedules: UpdateOpenSchedulePriorityItem[]
}

export interface CloseOpenScheduleRequest {
  openScheduleId: number
  closeQty: number
  updatedByEmpId: string
}

export interface OpenScheduleOperation {
  operationId: number
  openScheduleId: number
  sequenceNo: number
  operationName: string
  processTeam: string
  plannedQty: number
  availableStock: number
  stockUsed: number
  toProduce: number
  producedQtyOverall: number
  noOfOperators: number
  isQrApplicable: boolean
}

export interface ConsumeStockRequest {
  scheduleOperationId: number
  consumeStockQty: number
  updatedByEmpId: string
}

export interface UpdateToProduceRequest {
  scheduleOperationId: number
  toProduceQty: number
  updatedByEmpId: string
}
