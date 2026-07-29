import { api, unwrap } from "../api"
import type { ApiResponse } from "@/types/auth"
import type {
  CreateIdentifierRequest,
  CreateProductRequest,
  IdentifierRecord,
  OperationRow,
  OperationType,
  ProductRecord,
  RawOperationRecord,
  UpdateIdentifierRequest,
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

    getIdentifiers: builder.query<IdentifierRecord[], void>({
      query: () => "/Product/identifier",
      transformResponse: unwrap,
      providesTags: [{ type: "Identifier", id: "LIST" }],
    }),
    createIdentifier: builder.mutation<ApiResponse<IdentifierRecord>, CreateIdentifierRequest>({
      query: (body) => ({ url: "/Product/identifier", method: "POST", body }),
      invalidatesTags: [{ type: "Identifier", id: "LIST" }],
    }),
    updateIdentifier: builder.mutation<
      ApiResponse<IdentifierRecord>,
      { identifierTypeId: number; body: UpdateIdentifierRequest }
    >({
      query: ({ identifierTypeId, body }) => ({ url: `/Product/identifier/${identifierTypeId}`, method: "PUT", body }),
      invalidatesTags: [{ type: "Identifier", id: "LIST" }, { type: "Product", id: "LIST" }],
    }),
    // The path already carries the id being deleted; the array body just mirrors the shape the
    // backend expects (same as the productIds/operationIds bulk-delete bodies elsewhere).
    deleteIdentifier: builder.mutation<ApiResponse<null>, number>({
      query: (identifierTypeId) => ({
        url: `/Product/identifier/${identifierTypeId}`,
        method: "DELETE",
        body: { identifierTypeId: [identifierTypeId] },
      }),
      invalidatesTags: [{ type: "Identifier", id: "LIST" }],
    }),

    getOperations: builder.query<OperationRow[], { productId: number; operationType: OperationType }>({
      query: ({ productId, operationType }) => `/Product/${productId}/operations/${operationType}`,
      transformResponse: (res: ApiResponse<RawOperationRecord[]>, _meta, arg) =>
        res.data.map((op) => ({
          id: (arg.operationType === "production" ? op.productionOperationId : op.reworkOperationId) ?? 0,
          sequenceNo: op.sequenceNo,
          operationName: op.operationName,
          processTeam: op.processTeam,
          isQrApplicable: op.isQrApplicable,
        })),
      providesTags: (_result, _error, arg) => [operationTag(arg.productId, arg.operationType)],
    }),
    addOperation: builder.mutation<
      ApiResponse<null>,
      { productId: number; operationType: OperationType; operationName: string; processTeam: string; isQrApplicable: boolean }
    >({
      query: ({ productId, operationType, operationName, processTeam, isQrApplicable }) => ({
        url: `/Product/${productId}/operations/${operationType}`,
        method: "POST",
        body: { operationName, processTeam, isQrApplicable },
      }),
      invalidatesTags: (_result, _error, arg) => [
        operationTag(arg.productId, arg.operationType),
        { type: "Product", id: "LIST" },
      ],
    }),
    editOperation: builder.mutation<
      ApiResponse<null>,
      { productId: number; operationType: OperationType; operationId: number; operationName: string; processTeam: string; isQrApplicable: boolean }
    >({
      query: ({ productId, operationType, operationId, operationName, processTeam, isQrApplicable }) => ({
        url: `/Product/${productId}/edit-operations/${operationType}/${operationId}`,
        method: "PUT",
        body: { operationName, processTeam, isQrApplicable },
      }),
      invalidatesTags: (_result, _error, arg) => [operationTag(arg.productId, arg.operationType)],
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
        operations: { sequenceNo: number; operationName: string; processTeam: string; isQrApplicable: boolean }[]
      }
    >({
      query: ({ productId, operationType, operations }) => ({
        url: `/Product/${productId}/reorder-operations/${operationType}`,
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
  useGetIdentifiersQuery,
  useCreateIdentifierMutation,
  useUpdateIdentifierMutation,
  useDeleteIdentifierMutation,
  useGetOperationsQuery,
  useAddOperationMutation,
  useEditOperationMutation,
  useDeleteOperationsMutation,
  useReorderOperationsMutation,
} = productApi
