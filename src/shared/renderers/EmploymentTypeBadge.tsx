import type { ICellRendererParams } from "ag-grid-community"
import { cn } from "@/lib/utils"

export function EmploymentTypeBadge({ value }: ICellRendererParams) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold",
        value === "Full Time"
          ? "bg-cyan-50 text-cyan-600"
          : "bg-red-50 text-red-500"
      )}
    >
      {value}
    </span>
  )
}
