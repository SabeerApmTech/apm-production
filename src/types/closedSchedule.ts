export interface ClosedScheduleRecord {
  scheduleDate: string
  scheduleId: string
  scheduleYear: number
  companyName: string
  companyLocation: string
  state: string
  productCode: string
  productName: string
  noOfOperations: number
  plannedQty: number
  targetDate: string
  closedAt: string
  createdByEmpId: string
  createdByEmpName: string
  isHandoverCompleted: boolean
}
