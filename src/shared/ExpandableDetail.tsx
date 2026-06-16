import type { ICellRendererParams, IsFullWidthRowParams, RowHeightParams } from "ag-grid-community"
import { ChevronRight, ChevronDown } from "lucide-react"

/* ── Types ─────────────────────────────────────────────── */
export interface StepDetail {
  step: string
  operation: string
  successfulQty: number
  rejectedQty: number
}

export interface DetailRow {
  __isDetail: true
  parentId: number
  steps: StepDetail[]
}

/* ── Constants ──────────────────────────────────────────── */
export const STEP_COLORS    = ["#22c55e", "#ef4444", "#3b82f6", "#a855f7"]
export const DETAIL_HEADER_H = 40
export const DETAIL_ROW_H    = 48
export const DETAIL_PADDING  = 24

/* ── Detail full-width renderer ────────────────────────── */
export function DetailCellRenderer({ data }: { data: DetailRow }) {
  return (
    <div className="bg-gray-50 border-t border-b border-gray-200 px-6 py-3 overflow-x-auto">
      <table className="min-w-max text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="py-2 text-left font-semibold text-gray-600 w-32">Step</th>
            <th className="py-2 text-left font-semibold text-gray-600 w-40">Operation</th>
            <th className="py-2 text-left font-semibold text-gray-600">Successful Qty</th>
            <th className="py-2 text-left font-semibold text-gray-600 w-32 pl-4">Rejected Qty</th>
          </tr>
        </thead>
        <tbody>
          {data.steps.map((s, i) => {
            const color = STEP_COLORS[i % STEP_COLORS.length]
            const total = s.successfulQty + s.rejectedQty
            const pct   = total > 0 ? Math.round((s.successfulQty / total) * 100) : 0
            return (
              <tr key={s.step} className="border-b border-gray-100 last:border-0">
                <td className="py-3 text-gray-700 font-medium">{s.step}</td>
                <td className="py-3 text-gray-600">{s.operation}</td>
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-12 text-gray-800">{s.successfulQty}</span>
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden shrink-0">
                      <div style={{ width: `${pct}%`, backgroundColor: color }} className="h-full rounded-full" />
                    </div>
                    <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-white min-w-8 text-center" style={{ backgroundColor: "#374151" }}>
                      {pct}%
                    </span>
                  </div>
                </td>
                <td className="py-3 text-gray-700 pl-4">{s.rejectedQty}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* ── Expand toggle cell ─────────────────────────────────── */
export interface ExpandCellParams extends ICellRendererParams {
  expandedId?: number | null
  onToggle?: (id: number) => void
}

export function ExpandCell({ data, expandedId, onToggle }: ExpandCellParams) {
  if (!data || (data as DetailRow).__isDetail) return null
  const row        = data as { id: number; steps?: StepDetail[] }
  const isExpanded = expandedId === row.id
  if (!row.steps?.length) return null
  return (
    <div className="flex h-full items-center justify-center">
      <button
        onClick={(e) => { e.stopPropagation(); onToggle?.(row.id) }}
        className="flex h-7 w-7 items-center justify-center rounded text-gray-500 hover:bg-gray-100 transition-colors"
      >
        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
    </div>
  )
}

/* ── Shared callbacks ───────────────────────────────────── */
export function isFullWidthRow(params: IsFullWidthRowParams): boolean {
  return !!(params.rowNode.data as DetailRow)?.__isDetail
}

export function getRowHeight(params: RowHeightParams): number | undefined {
  const row = params.data as DetailRow | undefined
  if (row?.__isDetail) {
    return DETAIL_HEADER_H + row.steps.length * DETAIL_ROW_H + DETAIL_PADDING
  }
  return undefined
}
