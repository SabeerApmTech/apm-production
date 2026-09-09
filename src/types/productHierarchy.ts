// Types for the /master/product hierarchy: a product belongs to a company + production item,
// a product has states, and each state has its own ordered list of operations. This is a
// separate API surface from the older /Product endpoints in `product.ts` (still used by
// schedules/reports/transaction logs) — kept apart so neither shape leaks into the other.

export interface MasterProduct {
  productId: number
  itemCode: string
  companyCode: string
  companyName: string
  productionCode: string
  productionItemName: string
}

export interface MasterProductRequest {
  itemCode: string
  companyId: number
  productionItemId: number
}

export interface ProductState {
  productStateId: number
  productId: number
  state: string
}

export interface ProductStateRequest {
  productId: number
  state: string
}

export interface ProductStateOperation {
  productionOperationId: number
  sequenceNumber: number
  operationCode: string
  operationName: string
}

export interface AddProductStateOperationsItem {
  sequenceNo: number
  operationCode: string
}

export interface AddProductStateOperationsRequest {
  productStateId: number
  items: AddProductStateOperationsItem[]
}
