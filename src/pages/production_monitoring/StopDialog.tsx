import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useGetEmployeeScanHistoryQuery } from "@/store/services/operationQrScanApi"
import { OTHERS_REASON, pad2, REJECTION_REASONS } from "./data"
import type { Operation } from "./types"

const textareaClass =
  "w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"

/** `reason` mirrors the action API's own `reason` field — populated from the Rejection Reason
 *  dropdown below, which only appears (and is only required) once there's a rejected qty. */
interface StopFormData { successQty: string; rejectedQty: string; remarks: string; reason: string }

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  operation: Operation | null
  /** True when the schedule already hit its target — the backend rejects a non-zero Successful Qty in that case. */
  targetReached?: boolean
  /** Needed to look up the QR scan count — only relevant when the operation is QR-applicable. */
  employeeId?: string
  scheduleId?: string
  onSave: (data: StopFormData) => Promise<void>
}

export function StopDialog({ open, onOpenChange, operation, targetReached, employeeId, scheduleId, onSave }: Props) {
  const [form, setForm] = useState<StopFormData>({ successQty: "", rejectedQty: "", remarks: "", reason: "" })
  // `reasonOption` drives the Select ("Others" included); `customReason` is only used when
  // "Others" is picked. The actual value sent as `reason` is derived from these two below.
  const [reasonOption, setReasonOption] = useState("")
  const [customReason, setCustomReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const hasRejection = Number(form.rejectedQty) > 0
  const isOthers = reasonOption === OTHERS_REASON
  const effectiveReason = isOthers ? customReason.trim() : reasonOption

  const { data: scanHistory } = useGetEmployeeScanHistoryQuery(
    { employeeId: employeeId ?? "", scheduleId: scheduleId ?? "", scheduleOperationId: operation?.operationId ?? 0 },
    { skip: !open || !operation?.isQrApplicable || !employeeId || !scheduleId }
  )

  // Resets the form whenever the dialog (re)opens, without an effect — adjusting state during
  // render avoids the extra post-mount render pass a useEffect would cost here.
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setForm({ successQty: targetReached ? "0" : "", rejectedQty: "", remarks: "", reason: "" })
      setReasonOption("")
      setCustomReason("")
    }
  }

  const handleSave = async () => {
    setSubmitting(true)
    try {
      await onSave({ ...form, reason: effectiveReason })
      setForm({ successQty: "", rejectedQty: "", remarks: "", reason: "" })
      setReasonOption("")
      setCustomReason("")
    } catch {
      // Toast middleware already surfaced the error; keep the dialog open so the user can retry.
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="mb-0">
          <DialogTitle className="text-center text-sm font-semibold text-violet-600">
            Step {pad2(operation?.sequenceNo ?? 0)} — {operation?.operationName}
          </DialogTitle>
        </DialogHeader>
        <p className="text-center text-xs font-semibold text-red-500 mb-4">Stopped</p>

        {scanHistory && (
          <p className="text-center text-xs font-medium text-blue-600 mb-3">
            Total Scanned Qty: {scanHistory.totalScannedQty}
          </p>
        )}

        {targetReached && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5 mb-3">
            Target quantity already achieved — enter 0 in Successful Qty.
          </p>
        )}

        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Successful Qty <span className="text-red-500">*</span></Label>
            <Input
              type="number" min={0} required
              value={form.successQty}
              onChange={e => setForm(f => ({ ...f, successQty: e.target.value }))}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Rejected Qty</Label>
            <Input
              type="number" min={0}
              value={form.rejectedQty}
              onChange={e => {
                setForm(f => ({ ...f, rejectedQty: e.target.value }))
                setReasonOption("")
                setCustomReason("")
              }}
              className="h-8 text-sm"
            />
          </div>
          {hasRejection && (
            <div className="space-y-1">
              <Label className="text-xs text-gray-600">Rejection Reason <span className="text-red-500">*</span></Label>
              <Select value={reasonOption} onValueChange={setReasonOption}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select reason..." />
                </SelectTrigger>
                <SelectContent>
                  {REJECTION_REASONS.map(r => (
                    <SelectItem key={r} value={r} className="text-sm">{r}</SelectItem>
                  ))}
                  <SelectItem value={OTHERS_REASON} className="text-sm">{OTHERS_REASON}</SelectItem>
                </SelectContent>
              </Select>
              {isOthers && (
                <Input
                  value={customReason}
                  onChange={e => setCustomReason(e.target.value)}
                  placeholder="Enter reason..."
                  className="h-8 text-sm mt-1.5"
                />
              )}
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Remarks</Label>
            <textarea
              rows={3}
              value={form.remarks}
              onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
              className={textareaClass}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            onClick={handleSave}
            disabled={form.successQty === "" || (hasRejection && !effectiveReason) || submitting}
            className="flex-1 h-8 text-xs bg-blue-500 hover:bg-blue-600 text-white"
          >
            {submitting ? "Saving..." : "Save"}
          </Button>
          <Button onClick={() => onOpenChange(false)} variant="destructive" className="flex-1 h-8 text-xs" disabled={submitting}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
