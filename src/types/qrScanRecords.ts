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

/** A single row from GET /api/operation-qr-scan/scanned-products. */
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

/** Wire shape from GET /api/operation-qr-scan/scanned-products. */
export interface ProducedProductsResponse {
  count: number
  records: ProducedProductRecord[]
}

/** A single row from GET /api/operation-qr-scan/scanned-records (or its filtered counterpart,
 *  GET /api/operation-qr-scan/scanned-records-filter). */
export interface ScannedRecord {
  transactionLogId: number
  scheduleId: string
  companyName: string
  companyLocation: string
  state: string
  productName: string
  targetQty: number
  employeeId: string
  employeeName: string
  operationName: string
  uniqueIdentifierName: string
  startedAt: string
  totalScannedQty: number
}

/** Wire shape from GET /api/operation-qr-scan/scanned-records (or scanned-records-filter). */
export interface ScannedRecordsResponse {
  totalRecords: number
  records: ScannedRecord[]
}

export interface ScannedRecordDetailEntry {
  batchNumber: number
  uniqueIdentifier: string
  scannedAt: string
}

/** Wire shape from GET /api/operation-qr-scan/scanned-record-details?transactionLogId=. */
export interface ScannedRecordDetail {
  transactionLogId: number
  scheduleId: string
  employeeId: string
  employeeName: string
  operationName: string
  totalScannedQty: number
  records: ScannedRecordDetailEntry[]
}
