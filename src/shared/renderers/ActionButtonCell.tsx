import type { ICellRendererParams } from "ag-grid-community"
import { cn } from "@/lib/utils"

interface ActionButtonCellParams extends ICellRendererParams {
  onAction?: (data: unknown) => void
  label?: string
  disabled?: boolean
}

export function ActionButtonCell({ data, onAction, label = "Action", disabled = false }: ActionButtonCellParams) {
  return (
    <div className="flex h-full items-center">
      <button
        onClick={(e) => { e.stopPropagation(); if (data && !disabled) onAction?.(data) }}
        disabled={disabled}
        className={cn(
          "rounded-md px-3 py-1 text-xs font-semibold text-white transition-colors",
          disabled ? "bg-gray-300 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
        )}
      >
        {label}
      </button>
    </div>
  )
}
