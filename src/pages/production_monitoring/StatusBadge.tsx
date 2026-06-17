import { cn } from "@/lib/utils"
import type { StepStatus } from "./types"

const CONFIG: Record<Exclude<StepStatus, "idle">, { dot: string; text: string; label: string }> = {
  running: { dot: "bg-green-500", text: "text-green-600", label: "Running" },
  paused:  { dot: "bg-amber-500", text: "text-amber-600", label: "Paused"  },
  stopped: { dot: "bg-red-500",   text: "text-red-500",   label: "Stopped" },
}

export function StatusBadge({ status }: { status: StepStatus }) {
  if (status === "idle") return <span className="text-gray-400 text-xs">—</span>
  const c = CONFIG[status]
  return (
    <span className={cn("flex items-center gap-1.5 text-xs font-medium", c.text)}>
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", c.dot)} />
      {c.label}
    </span>
  )
}
