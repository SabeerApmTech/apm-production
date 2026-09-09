export interface CompanyRecord {
  companyId: number
  companyCode: string
  companyName: string
  location: string
}

export interface CompanyRequest {
  companyCode: string
  companyName: string
  location: string
}
