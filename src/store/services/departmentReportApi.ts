import { api } from "../api"
import type { ApiResponse } from "@/types/auth"
import type { DepartmentSummaryRecord } from "@/types/departmentReport"

export const departmentReportApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDepartmentSummary: builder.query<DepartmentSummaryRecord[], void>({
      query: () => "/reports/departments",
      transformResponse: (res: ApiResponse<DepartmentSummaryRecord[]>) => res.data,
    }),
  }),
})

export const { useGetDepartmentSummaryQuery } = departmentReportApi
