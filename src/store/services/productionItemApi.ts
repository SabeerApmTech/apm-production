import { api, unwrap } from "../api"
import { getCurrentEmployeeId } from "@/utils/auth"
import type { ApiResponse } from "@/types/auth"
import type { ProductionItem, ProductionItemRequest, ProductionOperation, ProductionOperationRequest } from "@/types/productionItem"

const basePath = "/master/production-item"
const itemList = { type: "ProductionItem" as const, id: "LIST" }
const operationsTag = (id: number) => ({ type: "ProductionItemOperations" as const, id })

export const productionItemApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProductionItems: builder.query<ProductionItem[], void>({
      query: () => basePath,
      transformResponse: unwrap,
      providesTags: [itemList],
    }),
    createProductionItem: builder.mutation<ApiResponse<ProductionItem>, ProductionItemRequest>({
      query: (body) => ({ url: basePath, method: "POST", params: { employeeId: getCurrentEmployeeId() }, body }),
      invalidatesTags: [itemList],
    }),
    updateProductionItem: builder.mutation<ApiResponse<ProductionItem>, { productionItemId: number; body: ProductionItemRequest }>({
      query: ({ productionItemId, body }) => ({
        url: `${basePath}/${productionItemId}`, method: "PUT", params: { employeeId: getCurrentEmployeeId() }, body,
      }),
      invalidatesTags: [itemList],
    }),
    deleteProductionItems: builder.mutation<ApiResponse<null>, number[]>({
      // The item API accepts one id at a time. Invalidate even after a partial failure.
      queryFn: async (ids, _api, _options, baseQuery) => {
        const employeeId = getCurrentEmployeeId()
        let data: ApiResponse<null> = { success: true, message: "", data: null }
        for (const id of ids) {
          const result = await baseQuery({ url: `${basePath}/${id}`, method: "DELETE", params: { employeeId } })
          if (result.error) return { error: result.error }
          data = result.data as ApiResponse<null>
          if (data?.success === false) return { error: { status: "CUSTOM_ERROR", error: data.message, data } }
        }
        return { data }
      },
      invalidatesTags: (_result, _error, ids) => [itemList, ...ids.map(operationsTag)],
    }),
    getProductionItemOperations: builder.query<ProductionOperation[], number>({
      query: (id) => `${basePath}/${id}/operations`,
      transformResponse: unwrap,
      providesTags: (_result, _error, id) => [operationsTag(id)],
    }),
    addProductionItemOperation: builder.mutation<ApiResponse<ProductionOperation>, { productionItemId: number; body: ProductionOperationRequest }>({
      query: ({ productionItemId, body }) => ({
        url: `${basePath}/${productionItemId}/operations`, method: "POST", params: { employeeId: getCurrentEmployeeId() }, body,
      }),
      invalidatesTags: (_result, _error, { productionItemId }) => [itemList, operationsTag(productionItemId)],
    }),
    editProductionItemOperation: builder.mutation<ApiResponse<ProductionOperation>, { productionItemId: number; operationId: number; body: ProductionOperationRequest }>({
      query: ({ productionItemId, operationId, body }) => ({
        url: `${basePath}/${productionItemId}/operations/${operationId}`, method: "PUT", params: { employeeId: getCurrentEmployeeId() }, body,
      }),
      invalidatesTags: (_result, _error, { productionItemId }) => [itemList, operationsTag(productionItemId)],
    }),
    deleteProductionItemOperations: builder.mutation<ApiResponse<null>, { productionItemId: number; productionOperationIds: number[] }>({
      query: ({ productionOperationIds }) => ({
        url: `${basePath}/operation`, method: "DELETE", body: { employeeId: getCurrentEmployeeId(), productionOperationIds },
      }),
      invalidatesTags: (_result, _error, { productionItemId }) => [itemList, operationsTag(productionItemId)],
    }),
  }),
})

export const {
  useGetProductionItemsQuery, useCreateProductionItemMutation, useUpdateProductionItemMutation,
  useDeleteProductionItemsMutation, useGetProductionItemOperationsQuery, useAddProductionItemOperationMutation,
  useEditProductionItemOperationMutation, useDeleteProductionItemOperationsMutation,
} = productionItemApi
