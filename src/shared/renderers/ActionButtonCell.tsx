import type { ICellRendererParams } from "ag-grid-community"

interface ActionButtonCellParams extends ICellRendererParams {
  onAction?: (data: unknown) => void
  label?: string
}

export function ActionButtonCell({ data, onAction, label = "Action" }: ActionButtonCellParams) {
  return (
    <div className="flex h-full items-center">
      <button
        onClick={(e) => { e.stopPropagation(); if (data) onAction?.(data) }}
        className="rounded-md bg-blue-500 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-600 transition-colors"
      >
        {label}
      </button>
    </div>
  )
}
