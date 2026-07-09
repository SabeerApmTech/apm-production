/** Wire shape from GET /api/HandoverToStore/HandoverPendingList. */
export interface HandoverPendingRecord {
  scheduleDate: string
  scheduleId: string
  companyName: string
  companyLocation: string
  productName: string
  targetQty: number
  producedQty: number
  deliveredQty: number
  handoverPendingQty: number
  readyToMove: number
  scheduleTable: "Completed" | "Pending"
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
  storeName: string
  receivedBy: string
  remarks: string
  createdByEmpId: string
  createdByEmpName: string
  createdAt: string
}

export interface CreateHandoverRequest {
  scheduleId: string
  storeName: string
  receivedBy: string
  handoverQty: number
  remarks: string
  createdByEmpId: string
}
