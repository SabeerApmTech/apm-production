import { api, unwrap } from "../api"
import type {
  ProductProductionSummaryParams,
  ProductProductionSummaryRecord,
} from "@/types/productWiseReport"

export const reworkProductWiseReportApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getReworkProductProductionSummary: builder.query<
      ProductProductionSummaryRecord[],
      ProductProductionSummaryParams | void
    >({
      query: (params) => {
        const query: Record<string, string> = {}
        if (params?.fromDate) query.FromDate = params.fromDate
        if (params?.toDate) query.ToDate = params.toDate
        if (params?.itemCode) query.ItemCode = params.itemCode
        return { url: "/reports/product-rework-report", params: query }
      },
      transformResponse: unwrap,
    }),
  }),
})

export const { useGetReworkProductProductionSummaryQuery } = reworkProductWiseReportApi
