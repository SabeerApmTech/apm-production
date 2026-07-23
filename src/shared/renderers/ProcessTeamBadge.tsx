import type { ICellRendererParams } from "ag-grid-community"
import { cn } from "@/lib/utils"
import { processTeamBadgeClasses } from "@/shared/processTeamBadge"

export function ProcessTeamBadge({ value }: ICellRendererParams) {
  if (!value) return null
  return (
    <div className="flex h-full items-center">
      <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", processTeamBadgeClasses(value))}>
        {value}
      </span>
    </div>
  )
}
