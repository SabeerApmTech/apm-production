import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { LoadingRow } from "@/shared/LoadingRow"
import { useGetScannedRecordDetailsQuery } from "@/store/services/operationQrScanApi"
import { formatLogDateTime } from "@/utils/date"

interface ScannedRecordDetailPanelProps {
  scheduleId: string
  employeeId: string
  operationName: string
  className?: string
  onClose?: () => void
}

export function ScannedRecordDetailPanel({ scheduleId, employeeId, operationName, className, onClose }: ScannedRecordDetailPanelProps) {
  const { data, isLoading } = useGetScannedRecordDetailsQuery({ scheduleId, employeeId, operationName })
  const records = data?.records ?? []

  return (
    <div className={cn("flex w-105 shrink-0 self-start max-h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm", className)}>
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">Scan Details</p>
          <p className="mt-0.5 text-xs text-gray-400">Total Scanned Qty: {data?.totalScannedQty ?? 0}</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <LoadingRow label="Loading scanned codes…" className="justify-center py-12 text-gray-400" />
        ) : !records.length ? (
          <div className="flex items-center justify-center py-12 text-sm text-gray-400">
            No QR codes scanned for this record.
          </div>
        ) : (
          <table className="min-w-max w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="py-2 pl-4 pr-3 text-left text-xs font-semibold text-gray-500">Batch No</th>
                <th className="py-2 px-3 text-left text-xs font-semibold text-gray-500">Unique Identifier</th>
                <th className="py-2 pl-3 pr-4 text-left text-xs font-semibold text-gray-500">Scanned At</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={`${r.uniqueIdentifier}-${i}`} className="border-b border-gray-100 last:border-0">
                  <td className="py-2.5 pl-4 pr-3 text-gray-700">{r.batchNumber}</td>
                  <td className="py-2.5 px-3 font-medium text-gray-800">{r.uniqueIdentifier}</td>
                  <td className="py-2.5 pl-3 pr-4 whitespace-pre-line text-gray-600">{formatLogDateTime(r.scannedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
