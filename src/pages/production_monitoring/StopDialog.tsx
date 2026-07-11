import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { pad2 } from "./data"
import type { Operation } from "./types"

const textareaClass =
  "w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"

interface StopFormData { successQty: string; rejectedQty: string; remarks: string }

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  operation: Operation | null
  /** True when the schedule already hit its target — the backend rejects a non-zero Successful Qty in that case. */
  targetReached?: boolean
  onSave: (data: StopFormData) => Promise<void>
}

export function StopDialog({ open, onOpenChange, operation, targetReached, onSave }: Props) {
  const [form, setForm] = useState<StopFormData>({ successQty: "", rejectedQty: "", remarks: "" })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({ successQty: targetReached ? "0" : "", rejectedQty: "", remarks: "" })
      setError(null)
    }
  }, [open, targetReached])

  const handleSave = async () => {
    setError(null)
    setSubmitting(true)
    try {
      await onSave(form)
      setForm({ successQty: "", rejectedQty: "", remarks: "" })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to stop. Please try again.")
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
              onChange={e => setForm(f => ({ ...f, rejectedQty: e.target.value }))}
              className="h-8 text-sm"
            />
          </div>
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

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-2 py-1.5 mt-3">
            {error}
          </p>
        )}

        <div className="flex gap-2 mt-4">
          <Button
            onClick={handleSave}
            disabled={form.successQty === "" || submitting}
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
