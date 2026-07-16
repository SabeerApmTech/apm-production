import { api, unwrap } from "../api"
import type {
  ProductProductionSummaryParams,
  ProductProductionSummaryRecord,
} from "@/types/productWiseReport"

export const productWiseReportApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProductProductionSummary: builder.query<
      ProductProductionSummaryRecord[],
      ProductProductionSummaryParams | void
    >({
      query: (params) => {
        const query: Record<string, string> = {}
        if (params?.fromDate) query.FromDate = params.fromDate
        if (params?.toDate) query.ToDate = params.toDate
        if (params?.itemCode) query.ItemCode = params.itemCode
        return { url: "/reports/product-production-summary", params: query }
      },
      transformResponse: unwrap,
    }),
  }),
})

export const { useGetProductProductionSummaryQuery } = productWiseReportApi
