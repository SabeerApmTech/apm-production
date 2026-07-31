import { useEffect, useRef, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useSaveBulkOperationQrScanMutation, useGetEmployeeScanHistoryQuery } from "@/store/services/operationQrScanApi"
import type { IdentifierRecord } from "@/types/product"
import type { ReworkType } from "@/types/reworkSchedule"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  scheduleId: string
  employeeId: string
  scheduleOperationId: number
  identifier?: IdentifierRecord
  /** Null for a production operation; the schedule's own rework type for a rework operation. */
  reworkType: ReworkType | null
}

/** Checks the scanned value against the identifier's own length/digits-only rules before it's
 *  added to the pending batch — returns an error message, or null if the value is valid. */
function validateIdentifierId(value: string, identifier: IdentifierRecord | undefined): string | null {
  if (!identifier) return null
  if (identifier.isDigitsOnly && !/^\d+$/.test(value)) return "Digits only"
  if (identifier.minLength && value.length < identifier.minLength) return `Min length ${identifier.minLength}`
  if (identifier.maxLength && value.length > identifier.maxLength) return `Max length ${identifier.maxLength}`
  return null
}

/** A USB barcode scanner behaves like a keyboard — it just types the code into whichever field is
 *  focused and sends Enter. Each scan is only staged into a local batch (never sent to the
 *  backend on its own); the operator reviews the batch and clicks Save to submit it all at once
 *  via /operation-qr-scan/save-bulk. */
export function ScanDialog({ open, onOpenChange, scheduleId, employeeId, scheduleOperationId, identifier, reworkType }: Props) {
  const identifierName = identifier?.identifierName ?? ""
  const [identifierId, setIdentifierId] = useState("")
  const [pendingCodes, setPendingCodes] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [saveBulkScan, { isLoading: isSaving }] = useSaveBulkOperationQrScanMutation()
  const { data: scanHistory } = useGetEmployeeScanHistoryQuery(
    { employeeId, scheduleId, scheduleOperationId },
    { skip: !open }
  )

  // Resets the batch only when the underlying work context actually changes (a different
  // operation), not just because the dialog closed and reopened — an accidental outside-click
  // close must not lose scanned-but-unsaved codes or a partially typed ID.
  const [prevContext, setPrevContext] = useState({ scheduleId, employeeId, scheduleOperationId })
  if (
    scheduleId !== prevContext.scheduleId ||
    employeeId !== prevContext.employeeId ||
    scheduleOperationId !== prevContext.scheduleOperationId
  ) {
    setPrevContext({ scheduleId, employeeId, scheduleOperationId })
    setIdentifierId(""); setPendingCodes([]); setError(null)
  }

  // Only the transient error message is cleared on reopen, without an effect — adjusting state
  // during render avoids the extra post-mount render pass a useEffect would cost here.
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setError(null)
  }

  // Keeping focus on the input is a genuine DOM concern (the scanner types into whatever has
  // focus), so this one does need an effect.
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // Focus is requested on the next frame, after this render has committed — calling it
  // synchronously right after a state update can hit a DOM node that's still mid-transition and
  // silently no-op.
  function refocusInput() {
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  // Shared by Enter-to-stage (scanner) and Save (manual typing without pressing Enter first) —
  // folds whatever is currently typed into the batch, or returns null if it's empty/invalid
  // (setting `error` as a side effect in the invalid case).
  function stageCurrentInput(currentPending: string[]): string[] | null {
    const trimmed = identifierId.trim()
    if (!trimmed) return currentPending
    if (scanHistory?.scannedData.some((entry) => entry.identifierId === trimmed)) {
      setError("This code has already been scanned and saved")
      setIdentifierId("")
      refocusInput()
      return null
    }
    if (currentPending.includes(trimmed)) {
      setError("You have already scanned this code")
      setIdentifierId("")
      refocusInput()
      return null
    }
    const validationError = validateIdentifierId(trimmed, identifier)
    if (validationError) {
      setError(validationError)
      setIdentifierId("")
      refocusInput()
      return null
    }
    return [...currentPending, trimmed]
  }

  function handleScan() {
    const next = stageCurrentInput(pendingCodes)
    if (next === null) return
    setPendingCodes(next)
    setError(null)
    setIdentifierId("")
    refocusInput()
  }

  function removeCode(code: string) {
    setPendingCodes((prev) => prev.filter((c) => c !== code))
  }

  async function handleSave() {
    const codesToSave = stageCurrentInput(pendingCodes)
    if (codesToSave === null || codesToSave.length === 0) return
    setIdentifierId("")
    setError(null)
    try {
      await saveBulkScan({
        employeeId, scheduleId, scheduleOperationId, identifierName, reworkType, identifiers: codesToSave,
      }).unwrap()
      setPendingCodes([])
    } catch {
      // Toast middleware already surfaced the error; keep the batch so the user can retry.
      setPendingCodes(codesToSave)
    } finally {
      refocusInput()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold text-gray-800">Scan</DialogTitle>
        </DialogHeader>

        {scanHistory && (
          <p className="-mt-3 mb-3 text-xs font-medium text-blue-600">
            Total Scanned Qty: {scanHistory.totalScannedQty}
          </p>
        )}

        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Identifier Name</Label>
            <Input value={identifierName} disabled className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Identifier ID</Label>
            <Input
              ref={inputRef}
              value={identifierId}
              onChange={(e) => { setIdentifierId(e.target.value); setError(null) }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleScan() } }}
              placeholder="Scan barcode..."
              maxLength={identifier?.maxLength || undefined}
              className="h-8 text-sm"
            />
            {error ? (
              <p className="text-xs text-red-500">{error}</p>
            ) : identifier && (identifier.minLength || identifier.maxLength || identifier.isDigitsOnly) ? (
              <p className="text-xs text-gray-400">
                {identifier.minLength || identifier.maxLength ? `Length ${identifier.minLength}-${identifier.maxLength}` : ""}
                {identifier.isDigitsOnly ? " · Digits only" : ""}
              </p>
            ) : null}
          </div>

          {pendingCodes.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs text-gray-600">
                Scanned, not yet saved ({pendingCodes.length})
              </Label>
              <div className="max-h-32 overflow-y-auto rounded-lg border border-gray-200">
                {pendingCodes.map((code) => (
                  <div
                    key={code}
                    className="flex items-center justify-between gap-2 border-b border-dashed border-gray-100 px-2.5 py-1.5 text-xs last:border-b-0"
                  >
                    <span className="truncate text-gray-700">{code}</span>
                    <button
                      type="button"
                      onClick={() => removeCode(code)}
                      aria-label={`Remove ${code}`}
                      className="shrink-0 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={() => onOpenChange(false)} variant="outline" className="flex-1 h-8 text-xs">
            Close
          </Button>
          <Button
            onClick={handleSave}
            disabled={(pendingCodes.length === 0 && !identifierId.trim()) || isSaving}
            className="flex-1 h-8 text-xs bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isSaving ? "Saving..." : `Save${pendingCodes.length ? ` (${pendingCodes.length})` : ""}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
