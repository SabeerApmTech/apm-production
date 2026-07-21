export interface ReworkProductionHistoryScheduleRecord {
  reworkScheduleId: string
  reworkScheduleDate: string
  companyName: string
  productName: string
  targetQty: number
}

export interface ReworkProductionHistoryOperationRecord {
  reworkScheduleOperationId: number
  sequenceNo: number
  operationName: string
  successfulQty: number
  rejectedQty: number
  successfulQtyPercentage: number
}

export interface ReworkProductionHistoryLogRecord {
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
