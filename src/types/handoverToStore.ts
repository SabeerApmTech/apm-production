export interface PendingHandoverRecord {
  scheduleDate: string
  scheduleId: string
  companyName: string
  companyLocation: string
  productName: string
  targetQty: number
  deliveredQty: number
  handoverPendingQty: number
  producedQty: number
  readyToMove: number
  scheduleTable: string
}

export interface CreateHandoverRequest {
  scheduleId: string
  handoverQty: number
  storeLocation: string
  givenByEmpId: string
  givenByEmpName: string
  receivedBy: string
  remarks: string
}

/** Wire shape from GET /api/HandoverToStore/transaction-log — dates are ISO datetimes. */
export interface HandoverTransactionRecord {
  /** Alias of handoverId, kept only so the shared DeleteCell renderer (which reads `data.id`) works unmodified. */
  id: number
  handoverId: number
  handoverDate: string
  scheduleId: string
  companyName: string
  productName: string
  handoverQty: number
  givenByEmpId: string
  givenByEmpName: string
  receivedBy: string
  storeLocation: string
  remarks: string
  createdAt: string
}
