export type OperationType = "production" | "rework"

export interface ProductRecord {
  productId: number
  itemCode: string
  productName: string
  productionOperationCount: number
  reworkOperationCount: number
}

export interface CreateProductRequest {
  itemCode: string
  productName: string
}

export type UpdateProductRequest = CreateProductRequest

/** Normalized operation row used throughout the UI, regardless of the id field name the API uses per type. */
export interface OperationRow {
  id: number
  sequenceNo: number
  operationName: string
}

/** Raw shape from GET .../operations/{operationType} — the id field name differs by operationType. */
export interface RawOperationRecord {
  productionOperationId?: number
  reworkOperationId?: number
  sequenceNo: number
  operationName: string
}
