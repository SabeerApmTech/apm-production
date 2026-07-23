export interface RawReworkTransactionLogRecord {
  reworkTransactionLogId: number
  logTime: string
  reworkScheduleId: string
  companyName: string
  productName: string
  sequenceNo: number
  operationName: string
  processTeam: string
  employeeId: string
  employeeName: string
  status: string
  logEvent: string
  successfulQty: number
  rejectedQty: number
  reason: string | null
  remarks: string | null
}

export interface ReworkTransactionLogRecord extends RawReworkTransactionLogRecord {
  /** Alias of reworkTransactionLogId, kept only so the shared DeleteCell renderer (which reads `data.id`) works unmodified. */
  id: number
}
