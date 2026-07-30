import { useEffect, useRef, useState } from "react"
import { Pause, Play, QrCode, Square } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatLogDateTime } from "@/utils/date"
import { processTeamBadgeClasses } from "@/shared/processTeamBadge"
import { ScheduleSummary } from "./ScheduleSummary"
import { StatusBadge } from "./StatusBadge"
import { ScanDialog } from "./ScanDialog"
import { useGetEmployeeScanHistoryQuery } from "@/store/services/operationQrScanApi"
import type { Operation, Schedule } from "./types"
import type { LogReportEntry } from "@/types/productionMonitoring"
import type { IdentifierRecord } from "@/types/product"

interface Props {
  schedule: Schedule
  operation: Operation
  logs: LogReportEntry[]
  activeHours: string
  idleHours: string
  /** Used to resolve `operation.identifierTypeId` to a display name. */
  identifiers?: IdentifierRecord[]
  /** The signed-in operator — needed for the QR scan action. */
  employeeId?: string
  onStart?: () => void
  onPause?: () => void
  onStop?: () => void
  /** Hides the Start/Pause/Stop controls — used to view another operator's work read-only. */
  readOnly?: boolean
}

export function WorkingView({ schedule, operation, logs, activeHours, idleHours, identifiers, employeeId, onStart, onPause, onStop, readOnly = false }: Props) {
  const identifierRecord = identifiers?.find((i) => i.identifierTypeId === operation.identifierTypeId)
  const identifierName = identifierRecord?.identifierName
  const [scanOpen, setScanOpen] = useState(false)
  const { data: scanHistory } = useGetEmployeeScanHistoryQuery(
    { employeeId: employeeId ?? "", scheduleId: schedule.scheduleId, scheduleOperationId: operation.operationId },
    { skip: !operation.isQrApplicable || !employeeId }
  )
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
      <div className={cn("shrink-0 grid grid-cols-1 gap-4 mb-5", operation.isQrApplicable ? "md:grid-cols-3" : "md:grid-cols-2")}>
        <ScheduleSummary schedule={schedule} />

        {/* Operation card — there's only ever one operation being worked at a time here */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3 pb-3 border-b border-gray-100">
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Step {operation.sequenceNo}</p>

            <div className="mt-0.5">
              <p className="text-sm font-semibold text-gray-900">{operation.operationName}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {operation.processTeam && (
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", processTeamBadgeClasses(operation.processTeam))}>
                    {operation.processTeam}
                  </span>
                )}
                {identifierName && (
                  <span className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                    operation.isQrApplicable ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-600"
                  )}>
                    {operation.isQrApplicable && <QrCode className="h-3.5 w-3.5" />}
                    {identifierName}
                  </span>
                )}
              </div>
              <div className="mt-1.5">
                <StatusBadge logEvent={lastEvent} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-3 mb-4">
            <div className="min-w-0">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Target Qty</dt>
              <dd className="text-sm font-semibold text-gray-800">{operation.targetQty}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Produced Qty</dt>
              <dd className="text-sm font-semibold text-gray-800">{operation.producedQty}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Pending Qty</dt>
              <dd className="text-sm font-semibold text-gray-800">{operation.pendingQty}</dd>
            </div>
            {operation.isQrApplicable && (
              <div className="min-w-0">
                <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Scanned Qty</dt>
                <dd className="text-sm font-semibold text-blue-600">{scanHistory?.totalScannedQty ?? "-"}</dd>
              </div>
            )}
          </div>
        </div>

        {/* Scanned codes — only relevant for a QR-applicable operation */}
        {operation.isQrApplicable && (
          <div className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col">
            <p className="text-sm font-semibold text-gray-900 mb-3 pb-3 border-b border-gray-100">
              Scanned Codes ({scanHistory?.totalScannedQty ?? 0})
            </p>
            <div className="flex-1 min-h-0 max-h-40 overflow-y-auto">
              {!scanHistory?.scannedData.length ? (
                <p className="py-4 text-center text-xs text-gray-400">No codes scanned yet.</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {scanHistory.scannedData.map((entry) => (
                    <span
                      key={entry.qrScanId}
                      className="rounded-md bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-700"
                    >
                      {entry.identifierId}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {schedule.isTargetReached && (
        <p className="shrink-0 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-4">
          Target quantity already achieved{isIdle ? "." : " — enter 0 in Successful Qty."}
        </p>
      )}

      {/* Log Report — the only section allowed to grow/scroll; everything above is shrink-0 so
          this always fits within the page's fixed-height, non-scrolling main area (tablet kiosk layout). */}
      <div className="shrink-0 flex items-center justify-between gap-3 mb-2.5">
        <p className="text-sm font-semibold text-gray-800">Log Report</p>
        {readOnly ? (
          <span className="text-xs text-gray-400">Read-only</span>
        ) : (
          <div className="flex items-center gap-1.5">
            {operation.isQrApplicable && !isIdle && (
              <button
                onClick={() => setScanOpen(true)}
                title="Scan"
                aria-label="Scan"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                <QrCode className="h-4 w-4" />
              </button>
            )}
            {isIdle && (
              <button
                onClick={onStart}
                disabled={isComplete}
                title="Start"
                aria-label="Start"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Play className="h-4 w-4" />
              </button>
            )}
            {(lastEvent === "START" || lastEvent === "RESUME") && (
              <>
                <button onClick={onPause} title="Pause" aria-label="Pause" className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-white hover:bg-amber-500 transition-colors">
                  <Pause className="h-4 w-4" />
                </button>
                <button onClick={onStop} title="Stop" aria-label="Stop" className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors">
                  <Square className="h-4 w-4" />
                </button>
              </>
            )}
            {lastEvent === "PAUSE" && (
              <button onClick={onStart} title="Resume" aria-label="Resume" className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors">
                <Play className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
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

      <ScanDialog
        open={scanOpen}
        onOpenChange={setScanOpen}
        scheduleId={schedule.scheduleId}
        employeeId={employeeId ?? ""}
        scheduleOperationId={operation.operationId}
        identifier={identifierRecord}
        reworkType={schedule.reworkType ?? null}
      />
    </div>
  )
}
