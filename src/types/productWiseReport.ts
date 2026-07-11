export interface ProductCompanyBreakdown {
  companyName: string
  producedQty: number
}

export interface ProductProductionSummaryRecord {
  itemCode: string
  productName: string
  fromDate: string | null
  toDate: string | null
  totalEmployees: number
  producedQty: number
  companies: ProductCompanyBreakdown[]
}

export interface ProductProductionSummaryParams {
  fromDate?: string
  toDate?: string
  itemCode?: string
}
