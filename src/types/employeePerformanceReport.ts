export interface EmployeePerformanceRecord {
  employeeId: string
  employeeName: string
  companyName: string
  productName: string
  operationName: string
  producedQty: number
  averagePerDay: number
}

export interface EmployeePerformanceReportParams {
  fromDate?: string
  toDate?: string
  employeeId?: string
  companyName?: string
  operationName?: string
}
