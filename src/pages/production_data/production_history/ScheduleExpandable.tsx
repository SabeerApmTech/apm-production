import type { ICellRendererParams, IsFullWidthRowParams } from "ag-grid-community"
import { ChevronRight, ChevronDown } from "lucide-react"

/** Bounds for the dynamically-measured detail row height — a floor while operations are still
 * loading, and a ceiling past which the detail scrolls internally instead of growing the row. */
export const MIN_DETAIL_HEIGHT = 96
export const MAX_DETAIL_HEIGHT = 420

export interface ScheduleDetailRow {
  __isDetail: true
  parentScheduleId: string
}

export interface ExpandCellParams extends ICellRendererParams {
  expandedId?: string | null
  onToggle?: (scheduleId: string) => void
}

export function ExpandCell({ data, expandedId, onToggle }: ExpandCellParams) {
  if (!data || (data as ScheduleDetailRow).__isDetail) return null
  const row = data as { scheduleId: string }
  const isExpanded = expandedId === row.scheduleId
  return (
    <div className="flex h-full items-center justify-center">
      <button
        onClick={(e) => { e.stopPropagation(); onToggle?.(row.scheduleId) }}
        className="flex h-7 w-7 items-center justify-center rounded text-gray-500 hover:bg-gray-100 transition-colors"
      >
        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
    </div>
  )
}

export function isFullWidthRow(params: IsFullWidthRowParams): boolean {
  return !!(params.rowNode.data as ScheduleDetailRow)?.__isDetail
}
