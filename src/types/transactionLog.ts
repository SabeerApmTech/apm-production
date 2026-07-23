export interface RawTransactionLogRecord {
  transactionLogId: number
  logTime: string
  employeeId: string
  employeeName: string
  scheduleId: string
  companyName: string
  productName: string
  sequenceNo: number
  operationName: string
  processTeam: string
  status: string
  logEvent: string
  successfulQty: number
  rejectedQty: number
  reason: string | null
  remarks: string | null
}

export interface TransactionLogRecord extends RawTransactionLogRecord {
  /** Alias of transactionLogId, kept only so the shared DeleteCell renderer (which reads `data.id`) works unmodified. */
  id: number
}
