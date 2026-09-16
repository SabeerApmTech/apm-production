// Types for the /master/product hierarchy: a product belongs to a company + production item,
// a product has states, and each state has its own ordered list of operations. This is a
// separate API surface from the older /Product endpoints in `product.ts` (still used by
// schedules/reports/transaction logs) — kept apart so neither shape leaks into the other.

export interface MasterProduct {
  productId: number
  /** The auto-generated per-company code, e.g. "LAK-001" — was called `itemCode` until the
   *  backend split it apart from the production item's own `itemCode` below. */
  productCode: string
  companyCode: string
  companyName: string
  /** The underlying production item's own code, e.g. "001" — see ProductionItem in
   *  @/types/productionItem (was called `productionCode` here). */
  itemCode: string
  /** Was called `productionItemName`. */
  itemName: string
}

export interface MasterProductRequest {
  productCode: string
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
  productStateOperationId: number
  sequenceNumber: number
  operationCode: string
  operationName: string
}

// Adds one operation at a time — referenced by its id in the production item's own operation
// catalog (see ProductionOperation in @/types/productionItem), not by code. The backend appends
// it at the end of the state's sequence itself; there's no client-supplied sequence number.
export interface AddProductStateOperationRequest {
  productStateId: number
  productionOperationId: number
}

export interface ReorderProductStateOperationsItem {
  sequenceNumber: number
  productStateOperationId: number
}

export interface ReorderProductStateOperationsRequest {
  productStateId: number
  items: ReorderProductStateOperationsItem[]
}
