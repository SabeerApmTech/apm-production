import type { ICellRendererParams } from "ag-grid-community"
import { cn } from "@/lib/utils"

export function StatusCell({ value }: ICellRendererParams) {
  const isRunning = value === "Running"
  return (
    <div className="flex h-full items-center gap-2">
      <span className={cn("h-2 w-2 rounded-full shrink-0", isRunning ? "bg-green-500" : "bg-red-500")} />
      <span className={cn("text-sm font-medium", isRunning ? "text-green-600" : "text-red-600")}>{value}</span>
    </div>
  )
}
