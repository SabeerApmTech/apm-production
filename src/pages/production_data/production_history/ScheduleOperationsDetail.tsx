import { Fragment, useEffect, useRef, useState } from "react"
import { ChevronRight, ChevronDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useGetProductionHistoryOperationsQuery,
  useGetProductionHistoryLogsQuery,
} from "@/store/services/productionHistoryApi"
import { formatLogDateTime } from "@/utils/date"
import { MAX_DETAIL_HEIGHT, MIN_DETAIL_HEIGHT } from "./ScheduleExpandable"

/** START/RUNNING read as active (green), STOP/STOPPED as ended (red), PAUSE/PAUSED as a warning
 * (amber) — anything else (a status/event value we don't know about) falls back to neutral gray. */
function logBadgeClass(value: string): string {
  const key = value.toUpperCase()
  if (key === "START" || key === "RESUME" || key === "RUNNING") {
    return "bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400"
  }
  if (key === "STOP" || key === "REJECT" || key === "STOPPED") {
    return "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
  }
  if (key === "PAUSE" || key === "PAUSED") {
    return "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
  }
  return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
}

function LogBadge({ value }: { value: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", logBadgeClass(value))}>
      {value}
    </span>
  )
}

interface LogsPanelProps {
  scheduleId: string
  sequenceNo: number
}

function LogsPanel({ scheduleId, sequenceNo }: LogsPanelProps) {
  const { data, isLoading } = useGetProductionHistoryLogsQuery({ scheduleId, sequenceNo })

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-3 pl-10 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading logs…
      </div>
    )
  }

  if (!data?.length) {
    return <div className="py-3 pl-10 text-sm text-gray-500">No transaction logs recorded for this operation.</div>
  }

  return (
    <div className="pl-10 pr-2 py-2 overflow-x-auto">
      <div className="max-h-56 overflow-y-auto">
        <table className="min-w-max w-full text-sm">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="border-b border-gray-200">
              <th className="py-2 pr-4 text-left font-semibold text-gray-600">Log Time</th>
              <th className="py-2 pr-4 text-left font-semibold text-gray-600">Employee</th>
              <th className="py-2 pr-4 text-left font-semibold text-gray-600">Event</th>
              <th className="py-2 pr-4 text-left font-semibold text-gray-600">Status</th>
              <th className="py-2 pr-4 text-left font-semibold text-gray-600">Successful Qty</th>
              <th className="py-2 pr-4 text-left font-semibold text-gray-600">Rejected Qty</th>
              <th className="py-2 text-left font-semibold text-gray-600">Reason / Remarks</th>
            </tr>
          </thead>
          <tbody>
            {data.map((log, i) => (
              <tr key={i} className="border-b border-gray-100 last:border-0">
                <td className="py-3 pr-4 whitespace-pre-line text-gray-700">{formatLogDateTime(log.logTime)}</td>
                <td className="py-3 pr-4 text-gray-700">
                  {log.employeeName} <span className="text-gray-400">({log.employeeId})</span>
                </td>
                <td className="py-3 pr-4"><LogBadge value={log.logEvent} /></td>
                <td className="py-3 pr-4"><LogBadge value={log.status} /></td>
                <td className="py-3 pr-4 text-gray-800">{log.successfulQty}</td>
                <td className="py-3 pr-4 text-gray-700">{log.rejectedQty}</td>
                <td className="py-3 text-gray-700">{log.reason || log.remarks || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface ScheduleOperationsDetailProps {
  scheduleId: string
  /** Reports the panel's natural content height (clamped to [MIN_DETAIL_HEIGHT, MAX_DETAIL_HEIGHT])
   * whenever it changes, so the parent grid can size the row to fit instead of leaving dead space. */
  onHeightChange?: (height: number) => void
}

export function ScheduleOperationsDetail({ scheduleId, onHeightChange }: ScheduleOperationsDetailProps) {
  const { data, isLoading } = useGetProductionHistoryOperationsQuery(scheduleId)
  const [expandedSeq, setExpandedSeq] = useState<number | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const onHeightChangeRef = useRef(onHeightChange)

  useEffect(() => {
    onHeightChangeRef.current = onHeightChange
  })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const report = () => {
      const measured = Math.min(Math.max(el.scrollHeight, MIN_DETAIL_HEIGHT), MAX_DETAIL_HEIGHT)
      onHeightChangeRef.current?.(measured)
    }
    report()
    const observer = new ResizeObserver(report)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="max-h-105 overflow-y-auto bg-gray-50 border-t border-b border-gray-200 px-6 py-3">
      {isLoading ? (
        <div className="flex items-center gap-2 py-3 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading operations…
        </div>
      ) : !data?.length ? (
        <div className="py-3 text-sm text-gray-500">No operations recorded for this schedule.</div>
      ) : (
        <table className="min-w-max w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="w-8" />
              <th className="py-2 text-left font-semibold text-gray-600 w-16">Seq</th>
              <th className="py-2 text-left font-semibold text-gray-600 w-40">Operation</th>
              <th className="py-2 text-left font-semibold text-gray-600">Successful Qty</th>
              <th className="py-2 text-left font-semibold text-gray-600 pl-4">Rejected Qty</th>
              <th className="py-2 text-left font-semibold text-gray-600 pl-4 w-28">Success %</th>
            </tr>
          </thead>
          <tbody>
            {data.map((op) => {
              const isOpen = expandedSeq === op.sequenceNo
              return (
                <Fragment key={op.scheduleOperationId}>
                  <tr className="border-b border-gray-100 last:border-0">
                    <td className="py-3">
                      <button
                        onClick={() => setExpandedSeq((prev) => (prev === op.sequenceNo ? null : op.sequenceNo))}
                        className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-gray-200 transition-colors"
                      >
                        {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      </button>
                    </td>
                    <td className="py-3 text-gray-700 font-medium">{op.sequenceNo}</td>
                    <td className="py-3 text-gray-700">{op.operationName}</td>
                    <td className="py-3 text-gray-800">{op.successfulQty}</td>
                    <td className="py-3 text-gray-700 pl-4">{op.rejectedQty}</td>
                    <td className="py-3 text-gray-700 pl-4">{op.successfulQtyPercentage}%</td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={6} className="bg-white p-0">
                        <LogsPanel scheduleId={scheduleId} sequenceNo={op.sequenceNo} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
