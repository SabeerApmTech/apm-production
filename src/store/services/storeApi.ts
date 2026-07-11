import { api } from "../api"
import { getAuthUser } from "@/utils/auth"
import type { ApiResponse } from "@/types/auth"
import type { StoreRecord, StoreRequest, StoreUpdateRequest } from "@/types/store"

export const storeApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getStores: builder.query<StoreRecord[], void>({
      query: () => "/store",
      transformResponse: (res: ApiResponse<StoreRecord[]>) => res.data,
      providesTags: [{ type: "Store", id: "LIST" }],
    }),
    createStore: builder.mutation<ApiResponse<StoreRecord>, StoreRequest>({
      query: (body) => ({ url: "/store", method: "POST", body }),
      invalidatesTags: [{ type: "Store", id: "LIST" }],
    }),
    updateStore: builder.mutation<ApiResponse<StoreRecord>, { storeId: number; body: StoreUpdateRequest }>({
      query: ({ storeId, body }) => ({ url: `/store/${storeId}`, method: "PUT", body }),
      invalidatesTags: [{ type: "Store", id: "LIST" }],
    }),
    // Takes full records (not just ids) so an active store can be blocked before the request is sent.
    deleteStores: builder.mutation<ApiResponse<null>, StoreRecord[]>({
      queryFn: async (stores, _queryApi, _extraOptions, baseQuery) => {
        const activeStores = stores.filter((s) => s.isActive)
        if (activeStores.length) {
          const names = activeStores.map((s) => `"${s.storeName}"`).join(", ")
          const message = activeStores.length > 1
            ? `${names} are active and cannot be deleted.`
            : `${names} is active and cannot be deleted.`
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "Active store",
              data: { success: false, message },
            },
          }
        }

        const result = await baseQuery({
          url: "/store",
          method: "DELETE",
          body: { storeIds: stores.map((s) => s.storeId), employeeId: getAuthUser()?.employeeId ?? "" },
        })
        return result.error ? { error: result.error } : { data: result.data as ApiResponse<null> }
      },
      invalidatesTags: [{ type: "Store", id: "LIST" }],
    }),
  }),
})

export const {
  useGetStoresQuery,
  useCreateStoreMutation,
  useUpdateStoreMutation,
  useDeleteStoresMutation,
} = storeApi
