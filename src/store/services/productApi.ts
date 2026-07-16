import { api, unwrap } from "../api"
import type { ApiResponse } from "@/types/auth"
import type {
  CreateProductRequest,
  OperationRow,
  OperationType,
  ProductRecord,
  RawOperationRecord,
  UpdateProductRequest,
} from "@/types/product"

function operationTag(productId: number, operationType: OperationType) {
  return { type: "ProductOperations" as const, id: `${productId}-${operationType}` }
}

export const productApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<ProductRecord[], void>({
      query: () => "/Product",
      transformResponse: unwrap,
      providesTags: [{ type: "Product", id: "LIST" }],
    }),
    createProduct: builder.mutation<ApiResponse<ProductRecord>, CreateProductRequest>({
      query: (body) => ({ url: "/Product", method: "POST", body }),
      invalidatesTags: [{ type: "Product", id: "LIST" }],
    }),
    updateProduct: builder.mutation<
      ApiResponse<ProductRecord>,
      { productId: number; body: UpdateProductRequest }
    >({
      query: ({ productId, body }) => ({ url: `/Product/${productId}`, method: "PUT", body }),
      invalidatesTags: [{ type: "Product", id: "LIST" }],
    }),
    deleteProducts: builder.mutation<ApiResponse<null>, number[]>({
      query: (productIds) => ({ url: "/Product", method: "DELETE", body: { productIds } }),
      invalidatesTags: [{ type: "Product", id: "LIST" }],
    }),

    getOperations: builder.query<OperationRow[], { productId: number; operationType: OperationType }>({
      query: ({ productId, operationType }) => `/Product/${productId}/operations/${operationType}`,
      transformResponse: (res: ApiResponse<RawOperationRecord[]>, _meta, arg) =>
        res.data.map((op) => ({
          id: (arg.operationType === "production" ? op.productionOperationId : op.reworkOperationId) ?? 0,
          sequenceNo: op.sequenceNo,
          operationName: op.operationName,
        })),
      providesTags: (_result, _error, arg) => [operationTag(arg.productId, arg.operationType)],
    }),
    addOperation: builder.mutation<
      ApiResponse<null>,
      { productId: number; operationType: OperationType; operationName: string }
    >({
      query: ({ productId, operationType, operationName }) => ({
        url: `/Product/${productId}/operations/${operationType}`,
        method: "POST",
        body: { operationName },
      }),
      invalidatesTags: (_result, _error, arg) => [
        operationTag(arg.productId, arg.operationType),
        { type: "Product", id: "LIST" },
      ],
    }),
    deleteOperations: builder.mutation<
      ApiResponse<null>,
      { productId: number; operationType: OperationType; operationIds: number[] }
    >({
      query: ({ productId, operationType, operationIds }) => ({
        url: `/Product/${productId}/operations/${operationType}`,
        method: "DELETE",
        body: { operationIds },
      }),
      invalidatesTags: (_result, _error, arg) => [
        operationTag(arg.productId, arg.operationType),
        { type: "Product", id: "LIST" },
      ],
    }),
    reorderOperations: builder.mutation<
      ApiResponse<null>,
      {
        productId: number
        operationType: OperationType
        operations: { sequenceNo: number; operationName: string }[]
      }
    >({
      query: ({ productId, operationType, operations }) => ({
        url: `/Product/${productId}/operations/${operationType}/reorder`,
        method: "PUT",
        body: { operations },
      }),
      invalidatesTags: (_result, _error, arg) => [operationTag(arg.productId, arg.operationType)],
    }),
  }),
})

export const {
  useGetProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductsMutation,
  useGetOperationsQuery,
  useAddOperationMutation,
  useDeleteOperationsMutation,
  useReorderOperationsMutation,
} = productApi
