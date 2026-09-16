import { api } from "../api"
import type {
  EmployeePerformanceRecord,
  EmployeePerformanceReportParams,
} from "@/types/employeePerformanceReport"

// The backend (ProductionTrackerApplication.API) has no /reports/* controller at all — this route
// doesn't exist. Disabled via a queryFn that resolves to an empty result so the report page
// renders its normal "no records" state. Reinstate the commented-out `query` once the backend
// adds a reports endpoint.
export const employeePerformanceReportApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getEmployeePerformanceReport: builder.query<
      EmployeePerformanceRecord[],
      EmployeePerformanceReportParams | void
    >({
      // query: (params) => {
      //   const query: Record<string, string> = {}
      //   if (params?.fromDate) query.FromDate = params.fromDate
      //   if (params?.toDate) query.ToDate = params.toDate
      //   if (params?.employeeId) query.EmployeeId = params.employeeId
      //   if (params?.companyName) query.CompanyName = params.companyName
      //   if (params?.operationName) query.OperationName = params.operationName
      //   return { url: "/reports/employee-production-report", params: query }
      // },
      // transformResponse: unwrap,
      queryFn: async () => ({ data: [] }),
    }),
  }),
})

export const { useGetEmployeePerformanceReportQuery } = employeePerformanceReportApi
