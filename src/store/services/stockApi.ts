import { api, unwrap } from "../api"
import type { ApiResponse } from "@/types/auth"
import type { StockOperationsByState, StockRecord, StockRequest } from "@/types/stock"

const basePath = "/master/stock"
const stockList = { type: "Stock" as const, id: "LIST" }
const operationsTag = (itemCode: string, companyName: string, productName: string) =>
  ({ type: "Stock" as const, id: `ops-${itemCode}-${companyName}-${productName}` })

export const stockApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getStocks: builder.query<StockRecord[], void>({
      query: () => basePath,
      transformResponse: unwrap,
      providesTags: [stockList],
    }),
    createStock: builder.mutation<ApiResponse<StockRecord>, { createdByEmpId: string; body: StockRequest }>({
      query: ({ createdByEmpId, body }) => ({ url: basePath, method: "POST", params: { createdByEmpId }, body }),
      invalidatesTags: [stockList],
    }),
    updateStock: builder.mutation<ApiResponse<StockRecord>, { stockId: number; updatedByEmpId: string; body: StockRequest }>({
      query: ({ stockId, updatedByEmpId, body }) => ({
        url: `${basePath}/${stockId}`, method: "PUT", params: { updatedByEmpId }, body,
      }),
      invalidatesTags: [stockList],
    }),
    deleteStock: builder.mutation<ApiResponse<null>, { stockId: number; deletedByEmpId: string }>({
      query: ({ stockId, deletedByEmpId }) => ({
        url: `${basePath}/${stockId}`, method: "DELETE", params: { deletedByEmpId },
      }),
      invalidatesTags: [stockList],
    }),
    bulkDeleteStock: builder.mutation<ApiResponse<null>, { stockIds: number[]; deletedByEmpId: string }>({
      query: ({ stockIds, deletedByEmpId }) => ({
        url: `${basePath}/bulk`, method: "DELETE", params: { deletedByEmpId }, body: { stockIds },
      }),
      invalidatesTags: [stockList],
    }),
    // "Add" and "Consume" both take the full record (same shape as create/update) and adjust
    // availableStockQty server-side — kept as separate mutations from updateStock/updateStockQuantity
    // since the API exposes them as distinct endpoints, presumably to log the adjustment as an
    // intake vs a consumption rather than a plain edit.
    addStock: builder.mutation<ApiResponse<StockRecord>, { stockId: number; updatedByEmpId: string; body: StockRequest }>({
      query: ({ stockId, updatedByEmpId, body }) => ({
        url: `${basePath}/add`, method: "PUT", params: { stockId, updatedByEmpId }, body,
      }),
      invalidatesTags: [stockList],
    }),
    consumeStock: builder.mutation<ApiResponse<StockRecord>, { stockId: number; updatedByEmpId: string; body: StockRequest }>({
      query: ({ stockId, updatedByEmpId, body }) => ({
        url: `${basePath}/consume`, method: "PUT", params: { stockId, updatedByEmpId }, body,
      }),
      invalidatesTags: [stockList],
    }),
    updateStockQuantity: builder.mutation<ApiResponse<StockRecord>, { stockId: number; updatedByEmpId: string; availableStockQty: number }>({
      query: ({ stockId, updatedByEmpId, availableStockQty }) => ({
        url: `${basePath}/${stockId}/quantity`, method: "PUT", params: { updatedByEmpId }, body: { availableStockQty },
      }),
      invalidatesTags: [stockList],
    }),
    getStockOperations: builder.query<StockOperationsByState[], { itemCode: string; companyName: string; productName: string }>({
      query: (params) => ({ url: `${basePath}/operations`, params }),
      transformResponse: unwrap,
      providesTags: (_result, _error, { itemCode, companyName, productName }) => [operationsTag(itemCode, companyName, productName)],
    }),
  }),
})

export const {
  useGetStocksQuery,
  useCreateStockMutation,
  useUpdateStockMutation,
  useDeleteStockMutation,
  useBulkDeleteStockMutation,
  useAddStockMutation,
  useConsumeStockMutation,
  useUpdateStockQuantityMutation,
  useGetStockOperationsQuery,
} = stockApi
