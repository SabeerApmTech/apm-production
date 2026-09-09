import type { ICellRendererParams } from "ag-grid-community"
import { cn } from "@/lib/utils"

interface ActionButtonCellParams extends ICellRendererParams {
  onAction?: (data: unknown) => void
  label?: string
  /** A plain boolean disables the whole column uniformly; a function decides per row (e.g. a
   * row with nothing left to action). */
  disabled?: boolean | ((data: unknown) => boolean)
  /** Overrides the default blue background — lets callers color the button by row state. */
  getButtonClass?: (data: unknown) => string
}

export function ActionButtonCell({ data, onAction, label = "Action", disabled = false, getButtonClass }: ActionButtonCellParams) {
  const isDisabled = typeof disabled === "function" ? (!data || disabled(data)) : disabled
  return (
    <div className="flex h-full items-center">
      <button
        onClick={(e) => { e.stopPropagation(); if (data && !isDisabled) onAction?.(data) }}
        disabled={isDisabled}
        className={cn(
          "rounded-md px-3 py-1 text-xs font-semibold text-white transition-colors",
          isDisabled ? "bg-gray-300 cursor-not-allowed" : (getButtonClass?.(data) ?? "bg-blue-500 hover:bg-blue-600")
        )}
      >
        {label}
      </button>
    </div>
  )
}
