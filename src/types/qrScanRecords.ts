/** A single row from GET /api/operation-qr-scan/schedule-list. */
export interface QrScheduleRecord {
  scheduleId: string
  companyName: string
  companyLocation: string
  state: string
  productName: string
  targetQty: number
}

/** Wire shape from GET /api/operation-qr-scan/schedule-list. */
export interface QrScheduleListResponse {
  totalSchedules: number
  schedules: QrScheduleRecord[]
}

/** A single row from GET /api/operation-qr-scan/schedule/{scheduleId}/transactions. */
export interface QrScheduleTransaction {
  transactionLogId: number
  sequenceNo: number
  operationName: string
  employeeId: string
  employeeName: string
  logTime: string
}

/** Wire shape from GET /api/operation-qr-scan/schedule/{scheduleId}/transactions. */
export interface QrScheduleTransactionsResponse {
  scheduleId: string
  totalTransactions: number
  transactions: QrScheduleTransaction[]
}

export interface QrCurrentSessionScan {
  qrScanId: number
  identifierName: string
  identifier: string
  batchNumber: number
  scannedAt: string
}

/** Wire shape from GET /api/operation-qr-scan/current-session?transactionLogId= — the QR codes
 *  scanned during one specific transaction log entry, as opposed to a whole schedule/operation. */
export interface QrCurrentSessionDetail {
  transactionLogId: number
  scheduleId: string
  productName: string
  operationName: string
  totalScannedQty: number
  totalBatches: number
  scannedData: QrCurrentSessionScan[]
}

/** A single row from GET /api/operation-qr-scan/produced-products. */
export interface ProducedProductRecord {
  qrScanId: number
  transactionLogId: number
  scheduleId: string
  employeeId: string
  employeeName: string
  companyName: string
  companyLocation: string
  state: string
  productName: string
  targetQty: number
  operationName: string
  uniqueIdentifierName: string
  uniqueIdentifier: string
  batchNumber: number
  scannedAt: string
}

/** Wire shape from GET /api/operation-qr-scan/produced-products. */
export interface ProducedProductsResponse {
  count: number
  records: ProducedProductRecord[]
}
