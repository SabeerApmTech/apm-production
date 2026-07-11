import { api } from "../api"
import type { ApiResponse } from "@/types/auth"
import type {
  EmployeePerformanceRecord,
  EmployeePerformanceReportParams,
} from "@/types/employeePerformanceReport"

export const employeePerformanceReportApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getEmployeePerformanceReport: builder.query<
      EmployeePerformanceRecord[],
      EmployeePerformanceReportParams | void
    >({
      query: (params) => {
        const query: Record<string, string> = {}
        if (params?.fromDate) query.FromDate = params.fromDate
        if (params?.toDate) query.ToDate = params.toDate
        if (params?.employeeId) query.EmployeeId = params.employeeId
        if (params?.companyName) query.CompanyName = params.companyName
        if (params?.operationName) query.OperationName = params.operationName
        return { url: "/reports/employee-performance-report", params: query }
      },
      transformResponse: (res: ApiResponse<EmployeePerformanceRecord[]>) => res.data,
    }),
  }),
})

export const { useGetEmployeePerformanceReportQuery } = employeePerformanceReportApi
