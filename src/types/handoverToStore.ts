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
