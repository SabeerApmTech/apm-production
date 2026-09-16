import { api } from "../api"
import type {
  ProductProductionSummaryParams,
  ProductProductionSummaryRecord,
} from "@/types/productWiseReport"

// The backend (ProductionTrackerApplication.API) has no /reports/* controller at all — this route
// doesn't exist. Disabled via a queryFn that resolves to an empty result so the report page
// renders its normal "no records" state. Reinstate the commented-out `query` once the backend
// adds a reports endpoint.
export const productWiseReportApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProductProductionSummary: builder.query<
      ProductProductionSummaryRecord[],
      ProductProductionSummaryParams | void
    >({
      // query: (params) => {
      //   const query: Record<string, string> = {}
      //   if (params?.fromDate) query.FromDate = params.fromDate
      //   if (params?.toDate) query.ToDate = params.toDate
      //   if (params?.itemCode) query.ItemCode = params.itemCode
      //   return { url: "/reports/product-production-report", params: query }
      // },
      // transformResponse: unwrap,
      queryFn: async () => ({ data: [] }),
    }),
  }),
})

export const { useGetProductProductionSummaryQuery } = productWiseReportApi
