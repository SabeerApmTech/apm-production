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
  const row = data as { reworkScheduleId: string }
  const isExpanded = expandedId === row.reworkScheduleId
  return (
    <div className="flex h-full items-center justify-center">
      <button
        onClick={(e) => { e.stopPropagation(); onToggle?.(row.reworkScheduleId) }}
        className="flex h-7 w-7 items-center justify-center rounded text-gray-500 hover:bg-gray-100 transition-colors"
      >
        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
    </div>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- helper colocated with ExpandCell, shared by the parent grid
export function isFullWidthRow(params: IsFullWidthRowParams): boolean {
  return !!(params.rowNode.data as ScheduleDetailRow)?.__isDetail
}
