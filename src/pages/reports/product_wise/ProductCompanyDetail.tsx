import type { ICellRendererParams, IsFullWidthRowParams, RowHeightParams } from "ag-grid-community"
import { ChevronRight, ChevronDown } from "lucide-react"
import type { ProductCompanyBreakdown } from "@/types/productWiseReport"

export interface CompanyDetailRow {
  __isDetail: true
  parentItemCode: string
  companies: ProductCompanyBreakdown[]
}

export const DETAIL_HEADER_H = 40
export const DETAIL_ROW_H = 44
export const DETAIL_PADDING = 24

export function CompanyDetailCellRenderer({ data }: { data: CompanyDetailRow }) {
  const total = data.companies.reduce((sum, c) => sum + c.producedQty, 0)
  return (
    <div className="bg-gray-50 border-t border-b border-gray-200 px-6 py-3 overflow-x-auto">
      <table className="min-w-max text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="py-2 text-left font-semibold text-gray-600 w-56">Company</th>
            <th className="py-2 text-left font-semibold text-gray-600">Produced Qty</th>
            <th className="py-2 text-left font-semibold text-gray-600 w-20 pl-4">Share</th>
          </tr>
        </thead>
        <tbody>
          {data.companies.length === 0 ? (
            <tr>
              <td colSpan={3} className="py-3 text-gray-500">No company-wise production recorded.</td>
            </tr>
          ) : (
            data.companies.map((c) => {
              const pct = total > 0 ? Math.round((c.producedQty / total) * 100) : 0
              return (
                <tr key={c.companyName} className="border-b border-gray-100 last:border-0">
                  <td className="py-3 text-gray-700 font-medium">{c.companyName}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <span className="w-14 text-gray-800">{c.producedQty}</span>
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden shrink-0">
                        <div style={{ width: `${pct}%`, backgroundColor: "#2a78d6" }} className="h-full rounded-full" />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-gray-700 pl-4">{pct}%</td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

export interface ExpandCellParams extends ICellRendererParams {
  expandedItemCode?: string | null
  onToggle?: (itemCode: string) => void
}

export function ExpandCell({ data, expandedItemCode, onToggle }: ExpandCellParams) {
  if (!data || (data as CompanyDetailRow).__isDetail) return null
  const row = data as { itemCode: string; companies?: ProductCompanyBreakdown[] }
  if (!row.companies?.length) return null
  const isExpanded = expandedItemCode === row.itemCode
  return (
    <div className="flex h-full items-center justify-center">
      <button
        onClick={(e) => { e.stopPropagation(); onToggle?.(row.itemCode) }}
        className="flex h-7 w-7 items-center justify-center rounded text-gray-500 hover:bg-gray-100 transition-colors"
      >
        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
    </div>
  )
}

export function isFullWidthRow(params: IsFullWidthRowParams): boolean {
  return !!(params.rowNode.data as CompanyDetailRow)?.__isDetail
}

export function getRowHeight(params: RowHeightParams): number | undefined {
  const row = params.data as CompanyDetailRow | undefined
  if (row?.__isDetail) {
    return DETAIL_HEADER_H + Math.max(row.companies.length, 1) * DETAIL_ROW_H + DETAIL_PADDING
  }
  return undefined
}
