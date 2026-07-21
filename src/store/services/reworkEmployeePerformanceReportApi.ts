import { api, unwrap } from "../api"
import type {
  EmployeePerformanceRecord,
  EmployeePerformanceReportParams,
} from "@/types/employeePerformanceReport"

export const reworkEmployeePerformanceReportApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getReworkEmployeePerformanceReport: builder.query<
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
        return { url: "/reports/rework-employee-performance-report", params: query }
      },
      transformResponse: unwrap,
    }),
  }),
})

export const { useGetReworkEmployeePerformanceReportQuery } = reworkEmployeePerformanceReportApi
