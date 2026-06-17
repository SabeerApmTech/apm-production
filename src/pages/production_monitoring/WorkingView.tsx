import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScheduleSummary } from "./ScheduleSummary"
import { StatusBadge } from "./StatusBadge"
import type { LogEntry, Operation, Schedule, StepStatus } from "./types"

interface Props {
  schedule: Schedule
  operation: Operation
  stepStatus: StepStatus
  logEntries: LogEntry[]
  onStart: () => void
  onPause: () => void
  onStop: () => void
}

export function WorkingView({ schedule, operation, stepStatus, logEntries, onStart, onPause, onStop }: Props) {
  return (
    <div>
      <ScheduleSummary schedule={schedule} />

      {/* Operations control table */}
      <div className="rounded-xl border border-gray-200 overflow-x-auto mb-5">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {["Step", "Operation", "Target Qty", "Produced Qty", "Pending Qty", "Status", "Actions"].map(h => (
                <th key={h} className="px-3 py-2.5 text-left text-gray-500 font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="text-gray-700">
              <td className="px-3 py-2.5">{operation.step}</td>
              <td className="px-3 py-2.5 whitespace-nowrap">{operation.name}</td>
              <td className="px-3 py-2.5">{operation.targetQty}</td>
              <td className="px-3 py-2.5">{operation.producedQty}</td>
              <td className="px-3 py-2.5">{operation.pendingQty}</td>
              <td className="px-3 py-2.5"><StatusBadge status={stepStatus} /></td>
              <td className="px-3 py-2.5">
                <div className="flex flex-col gap-1 items-start">
                  {stepStatus === "idle" && (
                    <Button onClick={onStart} className="h-7 px-4 text-xs bg-green-500 hover:bg-green-600 text-white min-w-16">
                      Start
                    </Button>
                  )}
                  {(stepStatus === "running" || stepStatus === "paused") && (
                    <>
                      {stepStatus === "running" ? (
                        <Button onClick={onPause} className="h-7 px-4 text-xs bg-amber-400 hover:bg-amber-500 text-white min-w-16">
                          Pause
                        </Button>
                      ) : (
                        <Button onClick={onStart} className="h-7 px-4 text-xs bg-green-500 hover:bg-green-600 text-white min-w-16">
                          Resume
                        </Button>
                      )}
                      <Button onClick={onStop} className="h-7 px-4 text-xs bg-red-500 hover:bg-red-600 text-white min-w-16">
                        Stop
                      </Button>
                    </>
                  )}
                  {stepStatus === "stopped" && (
                    <span className="text-xs font-medium text-red-500">Stopped</span>
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Log Report */}
      <p className="text-sm font-semibold text-gray-800 mb-2.5">Log Report</p>
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
          <span className="text-xs font-medium text-green-500">Active Hours: 0 Hrs</span>
          <span className="text-xs font-medium text-red-500">Idle Hours: 0 Hrs</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-sky-400 text-white">
                {["Date Time", "Status", "Successful Qty", "Rejected Qty", "Reason", "Remarks"].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-5 text-center text-gray-400">
                    No log entries yet. Click Start to begin.
                  </td>
                </tr>
              ) : (
                logEntries.map((entry, i) => (
                  <tr key={i} className={cn("border-t border-gray-100", i % 2 === 1 && "bg-gray-50/60")}>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-600">{entry.dateTime}</td>
                    <td className={cn("px-3 py-2 font-medium whitespace-nowrap", {
                      "text-green-600": entry.status === "Started" || entry.status === "Resumed",
                      "text-amber-600": entry.status === "Paused",
                      "text-red-500":   entry.status === "Stopped",
                    })}>
                      {entry.status}
                    </td>
                    <td className="px-3 py-2 text-gray-600">{entry.successQty  ?? "—"}</td>
                    <td className="px-3 py-2 text-gray-600">{entry.rejectedQty ?? "—"}</td>
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{entry.reason   ?? "—"}</td>
                    <td className="px-3 py-2 text-gray-600">{entry.remarks     ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
