import type { ICellRendererParams } from "ag-grid-community"
import { cn } from "@/lib/utils"
import { isDatePast } from "@/utils/date"

export function TargetDateCell({ value }: ICellRendererParams) {
  const past = isDatePast(String(value ?? ""))
  return (
    <span className={cn("text-sm font-medium", past ? "text-red-500" : "text-gray-700")}>
      {value}
    </span>
  )
}
