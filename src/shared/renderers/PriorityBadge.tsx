import type { ICellRendererParams } from "ag-grid-community"
import { cn } from "@/lib/utils"
import { PRIORITY_STYLES } from "@/shared/constants"

export function PriorityBadge({ value }: ICellRendererParams) {
  if (!value) return null
  return (
    <div className="flex h-full items-center">
      <span className={cn(
        "inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold",
        PRIORITY_STYLES[value as keyof typeof PRIORITY_STYLES] ?? "bg-gray-100 text-gray-700"
      )}>
        {value}
      </span>
    </div>
  )
}
