import { Fragment, useEffect, useRef, useState } from "react"
import { ChevronRight, ChevronDown } from "lucide-react"
import { LoadingRow } from "@/shared/LoadingRow"
import {
  useGetQrScheduleTransactionsQuery,
  useGetQrCurrentSessionDetailQuery,
} from "@/store/services/operationQrScanApi"
import { formatLogDateTime } from "@/utils/date"
import { MAX_DETAIL_HEIGHT, MIN_DETAIL_HEIGHT } from "./ScheduleExpandable"

interface CurrentSessionPanelProps {
  transactionLogId: number
}

function CurrentSessionPanel({ transactionLogId }: CurrentSessionPanelProps) {
  const { data, isLoading } = useGetQrCurrentSessionDetailQuery(transactionLogId)

  if (isLoading) {
    return <LoadingRow label="Loading scanned codes…" className="py-3 pl-10 text-gray-500" />
  }

  if (!data?.scannedData.length) {
    return <div className="py-3 pl-10 text-sm text-gray-500">No QR codes scanned in this session.</div>
  }

  return (
    <div className="pl-10 pr-2 py-2 overflow-x-auto">
      <div className="mb-2 flex gap-4 text-xs text-gray-500">
        <span>Total Scanned: <span className="font-semibold text-gray-700">{data.totalScannedQty}</span></span>
        <span>Total Batches: <span className="font-semibold text-gray-700">{data.totalBatches}</span></span>
      </div>
      <div className="max-h-56 overflow-y-auto">
        <table className="min-w-max w-full text-sm">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="border-b border-gray-200">
              <th className="py-2 pr-4 text-left font-semibold text-gray-600">Identifier Name</th>
              <th className="py-2 pr-4 text-left font-semibold text-gray-600">Identifier</th>
              <th className="py-2 pr-4 text-left font-semibold text-gray-600">Batch No</th>
              <th className="py-2 text-left font-semibold text-gray-600">Scanned At</th>
            </tr>
          </thead>
          <tbody>
            {data.scannedData.map((scan) => (
              <tr key={scan.qrScanId} className="border-b border-gray-100 last:border-0">
                <td className="py-3 pr-4 text-gray-700">{scan.identifierName}</td>
                <td className="py-3 pr-4 text-gray-800">{scan.identifier}</td>
                <td className="py-3 pr-4 text-gray-700">{scan.batchNumber}</td>
                <td className="py-3 whitespace-pre-line text-gray-700">{formatLogDateTime(scan.scannedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface TransactionsDetailProps {
  scheduleId: string
  /** Reports the panel's natural content height (clamped to [MIN_DETAIL_HEIGHT, MAX_DETAIL_HEIGHT])
   * whenever it changes, so the parent grid can size the row to fit instead of leaving dead space. */
  onHeightChange?: (height: number) => void
}

export function TransactionsDetail({ scheduleId, onHeightChange }: TransactionsDetailProps) {
  const { data, isLoading } = useGetQrScheduleTransactionsQuery(scheduleId)
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null)

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
        <LoadingRow label="Loading transactions…" className="py-3 text-gray-500" />
      ) : !data?.transactions.length ? (
        <div className="py-3 text-sm text-gray-500">No transactions recorded for this schedule.</div>
      ) : (
        <table className="min-w-max w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="w-8" />
              <th className="py-2 text-left font-semibold text-gray-600 w-16">Seq</th>
              <th className="py-2 text-left font-semibold text-gray-600 w-40">Operation</th>
              <th className="py-2 text-left font-semibold text-gray-600">Employee</th>
              <th className="py-2 text-left font-semibold text-gray-600 pl-4">Log Time</th>
            </tr>
          </thead>
          <tbody>
            {data.transactions.map((tx) => {
              const isOpen = expandedLogId === tx.transactionLogId
              return (
                <Fragment key={tx.transactionLogId}>
                  <tr className="border-b border-gray-100 last:border-0">
                    <td className="py-3">
                      <button
                        onClick={() => setExpandedLogId((prev) => (prev === tx.transactionLogId ? null : tx.transactionLogId))}
                        className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-gray-200 transition-colors"
                      >
                        {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      </button>
                    </td>
                    <td className="py-3 text-gray-700 font-medium">{tx.sequenceNo}</td>
                    <td className="py-3 text-gray-700">{tx.operationName}</td>
                    <td className="py-3 text-gray-700">
                      {tx.employeeName} <span className="text-gray-400">({tx.employeeId})</span>
                    </td>
                    <td className="py-3 whitespace-pre-line text-gray-700 pl-4">{formatLogDateTime(tx.logTime)}</td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={5} className="bg-white p-0">
                        <CurrentSessionPanel transactionLogId={tx.transactionLogId} />
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
