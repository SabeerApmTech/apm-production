export interface ProductionHistoryScheduleRecord {
  scheduleId: string
  scheduleDate: string
  companyName: string
  productName: string
  targetQty: number
}

export interface ProductionHistoryOperationRecord {
  scheduleOperationId: number
  sequenceNo: number
  operationName: string
  successfulQty: number
  rejectedQty: number
  successfulQtyPercentage: number
}

export interface ProductionHistoryLogRecord {
  logTime: string
  employeeId: string
  employeeName: string
  status: string
  logEvent: string
  successfulQty: number
  rejectedQty: number
  reason: string | null
  remarks: string | null
}
