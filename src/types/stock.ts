export interface StockRecord {
  stockId: number
  itemCode: string
  companyName: string
  companyLocation: string
  state: string
  productName: string
  sequenceNo: number
  operationName: string
  productionCode: string
  availableStockQty: number
  createdAt: string
  updatedAt: string
}

export type StockRequest = Pick<
  StockRecord,
  | "itemCode" | "companyName" | "companyLocation" | "state" | "productName"
  | "sequenceNo" | "operationName" | "productionCode" | "availableStockQty"
>

export interface StockOperationItem {
  stockId: number
  sequenceNo: number
  productionCode: string
  operationName: string
  availableStockQty: number
}

export interface StockOperationsByState {
  state: string
  operations: StockOperationItem[]
}
