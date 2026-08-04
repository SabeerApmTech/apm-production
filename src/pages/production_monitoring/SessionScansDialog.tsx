import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatLogDateTime } from "@/utils/date"
import { useGetCurrentSessionScansQuery } from "@/store/services/operationQrScanApi"
import type { ReworkType } from "@/types/reworkSchedule"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Null while no row is selected — the query is skipped until a STOP row's id is passed in. */
  transactionLogId: number | null
  reworkType: ReworkType | null
}

/** Read-only view of the QR codes scanned during one specific Start-to-Stop session, opened via
 *  the "View Scans" action on a STOP row in the Log Report table. */
export function SessionScansDialog({ open, onOpenChange, transactionLogId, reworkType }: Props) {
  const { data, isFetching } = useGetCurrentSessionScansQuery(
    { transactionLogId: transactionLogId ?? 0, reworkType },
    { skip: !open || transactionLogId == null }
  )
  const scannedData = data?.scannedData ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold text-gray-800">Session Scans</DialogTitle>
        </DialogHeader>

        {isFetching ? (
          <p className="py-4 text-center text-xs text-gray-400">Loading…</p>
        ) : (
          <>
            <p className="-mt-3 mb-3 text-xs font-medium text-blue-600">
              Total Scanned: {data?.totalScannedQty ?? 0}
            </p>
            <div className="max-h-72 overflow-y-auto rounded-lg border border-gray-200">
              {!scannedData.length ? (
                <p className="py-4 text-center text-xs text-gray-400">No codes scanned in this session.</p>
              ) : (
                scannedData.map((entry) => (
                  <div
                    key={entry.qrScanId}
                    className="flex items-center justify-between gap-2 border-b border-dashed border-gray-100 px-3 py-2 text-xs last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-700">{entry.identifier}</p>
                      <p className="text-[11px] text-gray-400">{entry.identifierName}</p>
                    </div>
                    <span className="shrink-0 whitespace-pre-line text-right text-[11px] text-gray-400">
                      {formatLogDateTime(entry.scannedAt)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
