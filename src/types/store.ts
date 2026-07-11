export interface StoreRecord {
  storeId: number
  storeName: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface StoreRequest {
  storeName: string
  employeeId: string
}

export interface StoreUpdateRequest {
  storeName: string
  isActive: boolean
  employeeId: string
}
