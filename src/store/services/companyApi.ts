import { api, unwrap } from "../api"
import type { ApiResponse } from "@/types/auth"
import type { CompanyRecord, CompanyRequest } from "@/types/company"

const basePath = "/master/company"
const companyList = { type: "Company" as const, id: "LIST" }

export const companyApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCompanies: builder.query<CompanyRecord[], void>({
      query: () => basePath,
      transformResponse: unwrap,
      providesTags: [companyList],
    }),
    createCompany: builder.mutation<ApiResponse<CompanyRecord>, CompanyRequest>({
      query: (body) => ({ url: basePath, method: "POST", body }),
      invalidatesTags: [companyList],
    }),
    updateCompany: builder.mutation<ApiResponse<CompanyRecord>, { companyId: number; body: CompanyRequest }>({
      query: ({ companyId, body }) => ({ url: `${basePath}/${companyId}`, method: "PUT", body }),
      invalidatesTags: [companyList],
    }),
    // The API only deletes one company at a time — loop so a multi-row selection in the UI
    // still works, same pattern as productHierarchyApi's deleteMasterProducts. Invalidate even
    // after a partial failure so the list reflects whatever actually got deleted.
    deleteCompanies: builder.mutation<ApiResponse<null>, number[]>({
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
      invalidatesTags: [companyList],
    }),
  }),
})

export const {
  useGetCompaniesQuery,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useDeleteCompaniesMutation,
} = companyApi
