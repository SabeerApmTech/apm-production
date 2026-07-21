/** Wire shape from GET /api/ReworkHandoverToStore/HandoverPendingList. */
export interface ReworkHandoverPendingRecord {
  reworkScheduleDate: string
  reworkScheduleId: string
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

/** Wire shape from GET /api/ReworkHandoverToStore/transaction-log — dates are ISO datetimes. */
export interface ReworkHandoverTransactionRecord {
  /** Alias of reworkHandoverId, kept only so the shared DeleteCell renderer (which reads `data.id`) works unmodified. */
  id: number
  reworkHandoverId: number
  handoverDate: string
  reworkScheduleId: string
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

export interface CreateReworkHandoverRequest {
  reworkScheduleId: string
  storeName: string
  receivedBy: string
  handoverQty: number
  remarks: string
  createdByEmpId: string
}
