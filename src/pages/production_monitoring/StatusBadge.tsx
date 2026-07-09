import { cn } from "@/lib/utils"
import type { LogReportEntry } from "@/types/productionMonitoring"

type LogEvent = LogReportEntry["logEvent"]

const CONFIG: Record<LogEvent, { dot: string; text: string; label: string }> = {
  START:  { dot: "bg-green-500", text: "text-green-600", label: "Running" },
  RESUME: { dot: "bg-green-500", text: "text-green-600", label: "Running" },
  PAUSE:  { dot: "bg-amber-500", text: "text-amber-600", label: "Paused"  },
  STOP:   { dot: "bg-red-500",   text: "text-red-500",   label: "Stopped" },
}

export const LOG_EVENT_LABELS: Record<LogEvent, string> = {
  START: CONFIG.START.label,
  RESUME: CONFIG.RESUME.label,
  PAUSE: CONFIG.PAUSE.label,
  STOP: CONFIG.STOP.label,
}

export function StatusBadge({ logEvent }: { logEvent: LogEvent | null }) {
  if (logEvent === null) return <span className="text-gray-400 text-xs">—</span>
  const c = CONFIG[logEvent]
  return (
    <span className={cn("flex items-center gap-1.5 text-xs font-medium", c.text)}>
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", c.dot)} />
      {c.label}
    </span>
  )
}
