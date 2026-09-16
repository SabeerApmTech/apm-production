import { api, unwrap } from "../api"
import type { ApiResponse } from "@/types/auth"
import type {
  AddProductStateOperationRequest,
  MasterProduct,
  MasterProductRequest,
  ProductState,
  ProductStateOperation,
  ProductStateRequest,
  ReorderProductStateOperationsRequest,
} from "@/types/productHierarchy"

const basePath = "/master/product"
const productList = { type: "MasterProduct" as const, id: "LIST" }
const statesTag = (productId: number) => ({ type: "ProductState" as const, id: productId })
const operationsTag = (productStateId: number) => ({ type: "ProductStateOperations" as const, id: productStateId })

export const productHierarchyApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMasterProducts: builder.query<MasterProduct[], void>({
      query: () => basePath,
      transformResponse: unwrap,
      providesTags: [productList],
    }),
    createMasterProduct: builder.mutation<ApiResponse<MasterProduct>, MasterProductRequest>({
      query: (body) => ({ url: basePath, method: "POST", body }),
      invalidatesTags: [productList],
    }),
    updateMasterProduct: builder.mutation<ApiResponse<MasterProduct>, { productId: number; body: MasterProductRequest }>({
      query: ({ productId, body }) => ({ url: `${basePath}/${productId}`, method: "PUT", body }),
      invalidatesTags: [productList],
    }),
    // The API only deletes one product at a time — loop so a multi-row selection in the UI still
    // works, same pattern as productionItemApi's deleteProductionItems. Invalidate even after a
    // partial failure so the list reflects whatever actually got deleted.
    deleteMasterProducts: builder.mutation<ApiResponse<null>, number[]>({
      queryFn: async (ids, _api, _options, baseQuery) => {
        let data: ApiResponse<null> = { success: true, message: "", data: null }
        for (const id of ids) {
          const result = await baseQuery({ url: `${basePath}/${id}`, method: "DELETE" })
          if (result.error) return { error: result.error }
          data = result.data as ApiResponse<null>
          if (data?.success === false) return { error: { status: "CUSTOM_ERROR", error: data.message, data } }
        }
        return { data }
      },
      invalidatesTags: [productList],
    }),

    getProductStates: builder.query<ProductState[], number>({
      query: (productId) => `${basePath}/${productId}/states`,
      transformResponse: unwrap,
      providesTags: (_result, _error, productId) => [statesTag(productId)],
    }),
    createProductState: builder.mutation<ApiResponse<ProductState>, ProductStateRequest>({
      query: (body) => ({ url: `${basePath}/states`, method: "POST", body }),
      invalidatesTags: (_result, _error, body) => [statesTag(body.productId)],
    }),
    updateProductState: builder.mutation<ApiResponse<ProductState>, { productStateId: number; body: ProductStateRequest }>({
      query: ({ productStateId, body }) => ({ url: `${basePath}/states/${productStateId}`, method: "PUT", body }),
      invalidatesTags: (_result, _error, { body }) => [statesTag(body.productId)],
    }),
    deleteProductState: builder.mutation<ApiResponse<null>, { productStateId: number; productId: number }>({
      query: ({ productStateId }) => ({ url: `${basePath}/states/${productStateId}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, { productId }) => [statesTag(productId)],
    }),

    getProductStateOperations: builder.query<ProductStateOperation[], number>({
      query: (productStateId) => `${basePath}/states/${productStateId}/operations`,
      transformResponse: unwrap,
      providesTags: (_result, _error, productStateId) => [operationsTag(productStateId)],
    }),
    addProductStateOperation: builder.mutation<ApiResponse<null>, AddProductStateOperationRequest>({
      query: (body) => ({ url: `${basePath}/states/operation`, method: "POST", body }),
      invalidatesTags: (_result, _error, body) => [operationsTag(body.productStateId)],
    }),
    deleteProductStateOperations: builder.mutation<ApiResponse<null>, { productStateId: number; productStateOperationIds: number[] }>({
      query: ({ productStateOperationIds }) => ({ url: `${basePath}/operations`, method: "DELETE", body: { productStateOperationIds } }),
      invalidatesTags: (_result, _error, { productStateId }) => [operationsTag(productStateId)],
    }),
    reorderProductStateOperations: builder.mutation<ApiResponse<null>, ReorderProductStateOperationsRequest>({
      query: ({ productStateId, items }) => ({
        url: `${basePath}/states/${productStateId}/operations/reorder`, method: "PUT", body: { items },
      }),
      invalidatesTags: (_result, _error, { productStateId }) => [operationsTag(productStateId)],
    }),
  }),
})

export const {
  useGetMasterProductsQuery,
  useCreateMasterProductMutation,
  useUpdateMasterProductMutation,
  useDeleteMasterProductsMutation,
  useGetProductStatesQuery,
  useCreateProductStateMutation,
  useUpdateProductStateMutation,
  useDeleteProductStateMutation,
  useGetProductStateOperationsQuery,
  useLazyGetProductStateOperationsQuery,
  useAddProductStateOperationMutation,
  useDeleteProductStateOperationsMutation,
  useReorderProductStateOperationsMutation,
} = productHierarchyApi
