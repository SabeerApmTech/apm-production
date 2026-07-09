/** Wire shape from GET /api/CompletedSchedule — dates are ISO here, kept as-is for client-side date-range filtering. */
export interface CompletedScheduleRecord {
  scheduleDate: string
  scheduleId: string
  scheduleYear: number
  companyName: string
  productName: string
  noOfOperations: number
  targetQty: number
  targetDate: string
  completedAt: string
  createdByEmpName: string
}
