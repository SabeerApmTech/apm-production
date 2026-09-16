export interface ProductionOperation {
  productionOperationId: number
  productionItemId: number
  operationCode: string
  operationName: string
  processTeamName: string
  isQrApplicable: boolean
}

export interface ProductionItem {
  productionItemId: number
  itemCode: string
  itemName: string
  identifierTypeId: number
  uniqueIdentifierName: string
  operations: ProductionOperation[]
}

export type ProductionItemRequest = Pick<ProductionItem, "itemCode" | "itemName" | "identifierTypeId">
export type ProductionOperationRequest = Pick<ProductionOperation, "operationCode" | "operationName" | "processTeamName" | "isQrApplicable">
