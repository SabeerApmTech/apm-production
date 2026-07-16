import { api, unwrap } from "../api"
import type { DepartmentSummaryRecord } from "@/types/departmentReport"

export const departmentReportApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDepartmentSummary: builder.query<DepartmentSummaryRecord[], void>({
      query: () => "/reports/departments",
      transformResponse: unwrap,
    }),
  }),
})

export const { useGetDepartmentSummaryQuery } = departmentReportApi
