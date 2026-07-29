import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  useScanOperationQrMutation,
  useGetEmployeeScanCountQuery,
} from "@/store/services/operationQrScanApi"
import type { IdentifierRecord } from "@/types/product"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  scheduleId: string
  employeeId: string
  scheduleOperationId: number
  identifier?: IdentifierRecord
}

/** Checks the scanned value against the identifier's own length/digits-only rules before it's
 *  sent to the backend — returns an error message, or null if the value is valid. */
function validateIdentifierId(value: string, identifier: IdentifierRecord | undefined): string | null {
  if (!identifier) return null
  if (identifier.isDigitsOnly && !/^\d+$/.test(value)) return "Digits only"
  if (identifier.minLength && value.length < identifier.minLength) return `Min length ${identifier.minLength}`
  if (identifier.maxLength && value.length > identifier.maxLength) return `Max length ${identifier.maxLength}`
  return null
}

/** A USB barcode scanner behaves like a keyboard — it just types the code into whichever field is
 *  focused and sends Enter, so this dialog isn't a scanner UI itself: it only has to keep the
 *  Identifier ID input focused and submit on Enter. */
export function ScanDialog({ open, onOpenChange, scheduleId, employeeId, scheduleOperationId, identifier }: Props) {
  const identifierName = identifier?.identifierName ?? ""
  const [identifierId, setIdentifierId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [scanOperationQr, { isLoading: isScanning }] = useScanOperationQrMutation()
  // A ref, not state — the input is never disabled, so a second Enter can fire before the
  // re-render carrying `isScanning: true` lands; this guards against that race synchronously.
  const isSubmittingRef = useRef(false)
  const { data: scanCount } = useGetEmployeeScanCountQuery(
    { employeeId, scheduleId, scheduleOperationId },
    { skip: !open }
  )

  // Resets the field whenever the dialog (re)opens, without an effect — adjusting state during
  // render avoids the extra post-mount render pass a useEffect would cost here.
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) { setIdentifierId(""); setError(null) }
  }

  // Keeping focus on the input is a genuine DOM concern (the scanner types into whatever has
  // focus), so this one does need an effect.
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // Focus is requested on the next frame, after this render has committed — calling it
  // synchronously right after a scan can hit a DOM node that's still mid-transition (e.g. the
  // input briefly disabled while the mutation was in flight) and silently no-op.
  function refocusInput() {
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const handleScan = async () => {
    if (isSubmittingRef.current) return
    const trimmed = identifierId.trim()
    if (!trimmed) return
    const validationError = validateIdentifierId(trimmed, identifier)
    if (validationError) {
      setError(validationError)
      setIdentifierId("")
      refocusInput()
      return
    }
    isSubmittingRef.current = true
    try {
      await scanOperationQr({
        scheduleId, employeeId, identifierName, identifierId: trimmed, scheduleOperationId,
      }).unwrap()
      setError(null)
    } catch {
      // Toast middleware already surfaced the error; keep the dialog open so the user can retry.
    } finally {
      isSubmittingRef.current = false
      setIdentifierId("")
      refocusInput()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold text-gray-800">Scan</DialogTitle>
        </DialogHeader>

        {scanCount && (
          <p className="-mt-3 mb-3 text-xs font-medium text-blue-600">
            Total Scanned Qty: {scanCount.totalScannedQty}
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
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={() => onOpenChange(false)} variant="outline" className="flex-1 h-8 text-xs">
            Close
          </Button>
          <Button
            onClick={handleScan}
            disabled={!identifierId.trim() || isScanning}
            className="flex-1 h-8 text-xs bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isScanning ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
