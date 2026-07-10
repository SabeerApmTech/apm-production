import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { MOCK_LOG_ENTRIES, MOCK_SCHEDULE_DETAIL, MOCK_STAGE_DETAIL } from "./data"
import type { EmployeeRecord } from "./types"

const STATUS_BADGE: Record<string, string> = {
  Running: "bg-green-500 text-white",
  Paused:  "bg-amber-400 text-white",
  Stopped: "bg-red-500 text-white",
}

interface Props {
  employee: EmployeeRecord
  onBack: () => void
}

export function DetailView({ employee, onBack }: Props) {
  const schedule = MOCK_SCHEDULE_DETAIL
  const stage    = MOCK_STAGE_DETAIL

  const scheduleCols: [string, string | number][] = [
    ["Priority No",   schedule.priorityNo],
    ["Schedule ID",   schedule.scheduleId],
    ["Schedule Date", schedule.scheduleDate],
    ["Company",       schedule.company],
    ["Product",       schedule.product],
    ["Target Date",   schedule.targetDate],
    ["Target Qty",    schedule.targetQty],
  ]

  return (
    <div className="flex flex-1 flex-col min-h-0 max-w-5xl">

      {/* Back + employee — fixed height */}
      <button
        onClick={onBack}
        className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Back
      </button>

      <p className="shrink-0 text-xs font-semibold text-red-500 mb-4">
        {employee.name} - {employee.employeeId}
      </p>

      {/* Schedule summary — fixed height */}
      <div className="shrink-0 rounded-xl border border-border overflow-x-auto mb-4">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              {scheduleCols.map(([k]) => (
                <th key={k} className="px-3 py-2 text-left text-muted-foreground font-medium whitespace-nowrap">{k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {scheduleCols.map(([k, v]) => (
                <td key={k} className="px-3 py-2.5 text-foreground whitespace-nowrap">{v}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Stage / operations table — fixed height */}
      <div className="shrink-0 rounded-xl border border-border overflow-x-auto mb-4">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              {["Stage", "Operation", "Target Qty", "Produced Qty", "Pending Qty", "Status", "Actions"].map(h => (
                <th key={h} className="px-3 py-2.5 text-left text-muted-foreground font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="text-foreground">
              <td className="px-3 py-2.5">{stage.stage}</td>
              <td className="px-3 py-2.5 whitespace-nowrap">{stage.operation}</td>
              <td className="px-3 py-2.5">{stage.targetQty}</td>
              <td className="px-3 py-2.5">{stage.producedQty}</td>
              <td className="px-3 py-2.5">{stage.pendingQty}</td>
              <td className="px-3 py-2.5">
                <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold", STATUS_BADGE[stage.status] ?? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300")}>
                  {stage.status}
                </span>
              </td>
              <td className="px-3 py-2.5">
                <div className="flex flex-col gap-1 items-start">
                  <button className="h-6 min-w-14 rounded px-2 text-xs font-semibold bg-amber-400 hover:bg-amber-500 text-white transition-colors">
                    Pause
                  </button>
                  <button className="h-6 min-w-14 rounded px-2 text-xs font-semibold bg-red-400 hover:bg-red-500 text-white transition-colors">
                    Stop
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Log Report heading — fixed height */}
      <p className="shrink-0 text-sm font-semibold text-foreground mb-2">Log Report</p>

      {/* Log Report card — fills remaining viewport space */}
      <div className="flex flex-col flex-1 min-h-0 rounded-xl border border-border">
        <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-border">
          <span className="text-xs font-medium text-green-600 dark:text-green-400">Active Hours: 2.30 Hrs</span>
          <span className="text-xs font-medium text-red-500 dark:text-red-400">Idle Hours: 1 Hrs</span>
        </div>
        {/* Table body scrolls; header stays pinned via sticky */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="sticky top-0">
              <tr className="bg-sky-400 text-white">
                {["Date Time", "Status", "Successful Qty", "Rejected Qty", "Reason", "Remarks"].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_LOG_ENTRIES.map((entry, i) => (
                <tr key={i} className={cn("border-t border-border", i % 2 === 1 && "bg-muted/40")}>
                  <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{entry.dateTime}</td>
                  <td className={cn("px-3 py-2 font-medium whitespace-nowrap", {
                    "text-green-600 dark:text-green-400": entry.status === "Started",
                    "text-amber-600 dark:text-amber-400": entry.status === "Paused",
                    "text-red-500 dark:text-red-400":     entry.status === "Stopped",
                  })}>
                    {entry.status}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{entry.successQty  ?? "—"}</td>
                  <td className={cn("px-3 py-2", entry.rejectedQty ? "text-red-500 dark:text-red-400 font-semibold" : "text-muted-foreground")}>
                    {entry.rejectedQty ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{entry.reason   ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{entry.remarks     ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
