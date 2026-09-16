import { api, unwrap } from "../api"
import type { ApiResponse } from "@/types/auth"
import type {
  CreateIdentifierRequest,
  IdentifierRecord,
  OperationRow,
  OperationType,
  UpdateIdentifierRequest,
} from "@/types/product"

export const productApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // getProducts (GET /master/product, typed as the stale ProductRecord shape) removed — it hit
    // a real, still-live endpoint, but one already reused (correctly typed as MasterProduct) by
    // productHierarchyApi's getMasterProducts. Callers now use useGetMasterProductsQuery instead.
    //
    // createProduct/updateProduct/deleteProducts (POST/PUT/DELETE /Product, /Product/{id}) and
    // getOperations's sibling mutations addOperation/editOperation/deleteOperations/
    // reorderOperations (/Product/{id}/operations/..., /edit-operations/..., /reorder-operations/...)
    // all removed — none of these bare /Product/* routes exist on the backend
    // (ProductionTrackerApplication.API only has /api/master/product/*), and none of these hooks
    // had any callers left in the app.

    getIdentifiers: builder.query<IdentifierRecord[], void>({
      query: () => "/master/product-identifier",
      transformResponse: unwrap,
      providesTags: [{ type: "Identifier", id: "LIST" }],
    }),
    createIdentifier: builder.mutation<ApiResponse<IdentifierRecord>, CreateIdentifierRequest>({
      query: (body) => ({ url: "/master/product-identifier", method: "POST", body }),
      invalidatesTags: [{ type: "Identifier", id: "LIST" }],
    }),
    updateIdentifier: builder.mutation<
      ApiResponse<IdentifierRecord>,
      { identifierTypeId: number; body: UpdateIdentifierRequest }
    >({
      query: ({ identifierTypeId, body }) => ({ url: `/master/product-identifier/${identifierTypeId}`, method: "PUT", body }),
      invalidatesTags: [{ type: "Identifier", id: "LIST" }, { type: "Product", id: "LIST" }, { type: "ProductionItem", id: "LIST" }],
    }),
    deleteIdentifier: builder.mutation<ApiResponse<null>, number>({
      query: (identifierTypeId) => ({ url: `/master/product-identifier/${identifierTypeId}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Identifier", id: "LIST" }],
    }),

    // GET /Product/{id}/operations/{type} — kept as a hook (still called by the Transaction Log and
    // Employee Performance Report filter dropdowns) but disabled via a queryFn, since that bare
    // /Product route doesn't exist on the backend either and there's no direct equivalent under
    // /master/product (operations there hang off a product *state*, not the product itself).
    // Reinstate the commented-out `query`/`transformResponse` if the backend adds one.
    getOperations: builder.query<OperationRow[], { productId: number; operationType: OperationType }>({
      // query: ({ productId, operationType }) => `/Product/${productId}/operations/${operationType}`,
      // transformResponse: (res: ApiResponse<RawOperationRecord[]>, _meta, arg) =>
      //   res.data.map((op) => ({
      //     id: (arg.operationType === "production" ? op.productionOperationId : op.reworkOperationId) ?? 0,
      //     sequenceNo: op.sequenceNo,
      //     operationName: op.operationName,
      //     processTeam: op.processTeam,
      //     isQrApplicable: op.isQrApplicable,
      //   })),
      queryFn: async () => ({ data: [] }),
    }),
  }),
})

export const {
  useGetIdentifiersQuery,
  useCreateIdentifierMutation,
  useUpdateIdentifierMutation,
  useDeleteIdentifierMutation,
  useGetOperationsQuery,
} = productApi
