import { api, unwrap } from "../api"
import type { ApiResponse } from "@/types/auth"
import type { CompanyRecord, CompanyRequest } from "@/types/company"

export const companyApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCompanies: builder.query<CompanyRecord[], void>({
      query: () => "/Company",
      transformResponse: unwrap,
      providesTags: [{ type: "Company", id: "LIST" }],
    }),
    createCompany: builder.mutation<ApiResponse<CompanyRecord>, CompanyRequest>({
      query: (body) => ({ url: "/Company", method: "POST", body }),
      invalidatesTags: [{ type: "Company", id: "LIST" }],
    }),
    updateCompany: builder.mutation<ApiResponse<CompanyRecord>, { companyId: number; body: CompanyRequest }>({
      query: ({ companyId, body }) => ({ url: `/Company/${companyId}`, method: "PUT", body }),
      invalidatesTags: [{ type: "Company", id: "LIST" }],
    }),
    deleteCompanies: builder.mutation<ApiResponse<null>, number[]>({
      query: (companyIds) => ({ url: "/Company", method: "DELETE", body: { companyIds } }),
      invalidatesTags: [{ type: "Company", id: "LIST" }],
    }),
  }),
})

export const {
  useGetCompaniesQuery,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useDeleteCompaniesMutation,
} = companyApi
