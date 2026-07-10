import type { ICellRendererParams } from "ag-grid-community"
import { cn } from "@/lib/utils"

function titleCase(value: string): string {
  return value.length ? value[0].toUpperCase() + value.slice(1).toLowerCase() : value
}

export function StatusCell({ value }: ICellRendererParams) {
  const raw = String(value ?? "")
  const isRunning = raw.toUpperCase() === "RUNNING"
  return (
    <div className="flex h-full items-center gap-2">
      <span className={cn("h-2 w-2 rounded-full shrink-0", isRunning ? "bg-green-500" : "bg-red-500")} />
      <span className={cn("text-sm font-medium", isRunning ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>{titleCase(raw)}</span>
    </div>
  )
}
