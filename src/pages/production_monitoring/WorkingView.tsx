import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { formatLogDateTime } from "@/utils/date"
import { ScheduleSummary } from "./ScheduleSummary"
import { StatusBadge } from "./StatusBadge"
import type { Operation, Schedule } from "./types"
import type { LogReportEntry } from "@/types/productionMonitoring"

interface Props {
  schedule: Schedule
  operation: Operation
  logs: LogReportEntry[]
  activeHours: string
  idleHours: string
  onStart?: () => void
  onPause?: () => void
  onStop?: () => void
  /** Hides the Start/Pause/Stop controls — used to view another operator's work read-only. */
  readOnly?: boolean
}

export function WorkingView({ schedule, operation, logs, activeHours, idleHours, onStart, onPause, onStop, readOnly = false }: Props) {
  const lastEvent = logs.length ? logs[logs.length - 1].logEvent : null
  // A STOP just ends that work session, not the whole operation — Start is available again after it.
  const isIdle = lastEvent === null || lastEvent === "STOP"
  const isComplete = operation.producedQty >= operation.targetQty

  // Touch tablet browsers largely ignore ::-webkit-scrollbar styling and only flash a native
  // overlay indicator during an active drag — draw a persistent thumb ourselves instead, so
  // operators can always see the log list scrolls, not just discover it by accident.
  const scrollRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLTableSectionElement>(null)
  const [scrollbar, setScrollbar] = useState({ visible: false, topPct: 0, heightPct: 100, headerHeight: 0 })

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = el
      // The header is sticky, not removed from scrollHeight — measure the ratio against the row
      // body alone so the thumb's size/position (and the track box itself) sit below the header
      // instead of painting over it.
      const headerHeight = headerRef.current?.getBoundingClientRect().height ?? 0
      const rowsScrollHeight = scrollHeight - headerHeight
      const rowsClientHeight = clientHeight - headerHeight
      const visible = rowsScrollHeight > rowsClientHeight + 1
      const heightPct = visible ? Math.max((rowsClientHeight / rowsScrollHeight) * 100, 10) : 100
      const maxScroll = rowsScrollHeight - rowsClientHeight
      const topPct = visible && maxScroll > 0 ? (scrollTop / maxScroll) * (100 - heightPct) : 0
      setScrollbar({ visible, topPct, heightPct, headerHeight })
    }

    update()
    el.addEventListener("scroll", update)
    const resizeObserver = new ResizeObserver(update)
    resizeObserver.observe(el)
    return () => {
      el.removeEventListener("scroll", update)
      resizeObserver.disconnect()
    }
  }, [logs])

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <div className="shrink-0">
        <ScheduleSummary schedule={schedule} />
      </div>

      {schedule.isTargetReached && (
        <p className="shrink-0 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-4">
          Target quantity already achieved{isIdle ? "." : " — enter 0 in Successful Qty."}
        </p>
      )}

      {/* Operations control table */}
      <div className="shrink-0 rounded-xl border border-gray-200 overflow-x-auto mb-5">
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
              <td className="px-3 py-2.5">{operation.sequenceNo}</td>
              <td className="px-3 py-2.5 whitespace-nowrap">{operation.operationName}</td>
              <td className="px-3 py-2.5">{operation.targetQty}</td>
              <td className="px-3 py-2.5">{operation.producedQty}</td>
              <td className="px-3 py-2.5">{operation.pendingQty}</td>
              <td className="px-3 py-2.5"><StatusBadge logEvent={lastEvent} /></td>
              <td className="px-3 py-2.5">
                {readOnly ? (
                  <span className="text-gray-400">—</span>
                ) : (
                <div className="flex flex-col gap-1 items-start">
                  {isIdle && (
                    <Button
                      onClick={onStart}
                      disabled={isComplete}
                      className="h-7 px-4 text-xs bg-green-500 hover:bg-green-600 text-white min-w-16 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Start
                    </Button>
                  )}
                  {(lastEvent === "START" || lastEvent === "RESUME") && (
                    <>
                      <Button onClick={onPause} className="h-7 px-4 text-xs bg-amber-400 hover:bg-amber-500 text-white min-w-16">
                        Pause
                      </Button>
                      <Button onClick={onStop} className="h-7 px-4 text-xs bg-red-500 hover:bg-red-600 text-white min-w-16">
                        Stop
                      </Button>
                    </>
                  )}
                  {lastEvent === "PAUSE" && (
                    <Button onClick={onStart} className="h-7 px-4 text-xs bg-green-500 hover:bg-green-600 text-white min-w-16">
                      Resume
                    </Button>
                  )}
                </div>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Log Report — the only section allowed to grow/scroll; everything above is shrink-0 so
          this always fits within the page's fixed-height, non-scrolling main area (tablet kiosk layout). */}
      <p className="shrink-0 text-sm font-semibold text-gray-800 mb-2.5">Log Report</p>
      <div className="flex flex-1 min-h-0 flex-col rounded-xl border border-gray-200 overflow-hidden">
        <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
          <span className="text-xs font-medium text-green-500">Active Hours: {activeHours} Hrs</span>
          <span className="text-xs font-medium text-red-500">Idle Hours: {idleHours} Hrs</span>
        </div>
        <div className="relative flex flex-1 min-h-0 flex-col">
          <div ref={scrollRef} className="no-scrollbar flex-1 min-h-0 overflow-x-auto overflow-y-auto">
            <table className="min-w-full text-xs">
              <thead ref={headerRef}>
                <tr className="bg-sky-400 text-white">
                  {["Date Time", "Log Event", "Successful Qty", "Rejected Qty", "Reason", "Remarks"].map(h => (
                    <th key={h} className="sticky top-0 z-10 bg-sky-400 px-3 py-2 text-left font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-5 text-center text-gray-400">
                      No log entries yet. Click Start to begin.
                    </td>
                  </tr>
                ) : (
                  logs.map((entry, i) => (
                    <tr key={i} className={cn("border-t border-gray-100", i % 2 === 1 && "bg-gray-50/60")}>
                      <td className="px-3 py-2 whitespace-pre-line text-gray-600">{formatLogDateTime(entry.logTime)}</td>
                      <td className={cn("px-3 py-2 font-medium whitespace-nowrap", {
                        "text-green-600": entry.logEvent === "START" || entry.logEvent === "RESUME",
                        "text-amber-600": entry.logEvent === "PAUSE",
                        "text-red-500":   entry.logEvent === "STOP",
                      })}>
                        {entry.logEvent}
                      </td>
                      <td className="px-3 py-2 text-gray-600">{entry.successfulQty}</td>
                      <td className="px-3 py-2 text-gray-600">{entry.rejectedQty}</td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{entry.reason ?? "—"}</td>
                      <td className="px-3 py-2 text-gray-600">{entry.remarks || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {scrollbar.visible && (
            <div
              className="pointer-events-none absolute right-1 z-20 bottom-1 w-1.5 rounded-full bg-gray-200"
              style={{ top: scrollbar.headerHeight + 4 }}
            >
              <div
                className="absolute w-full rounded-full bg-gray-400"
                style={{ top: `${scrollbar.topPct}%`, height: `${scrollbar.heightPct}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
