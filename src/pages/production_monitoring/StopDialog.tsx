import { useState } from "react"
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
  onSave: (data: StopFormData) => void
}

export function StopDialog({ open, onOpenChange, operation, onSave }: Props) {
  const [form, setForm] = useState<StopFormData>({ successQty: "", rejectedQty: "", remarks: "" })

  const handleSave = () => {
    onSave(form)
    setForm({ successQty: "", rejectedQty: "", remarks: "" })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="mb-0">
          <DialogTitle className="text-center text-sm font-semibold text-violet-600">
            Step {pad2(operation?.step ?? 0)} — {operation?.name}
          </DialogTitle>
        </DialogHeader>
        <p className="text-center text-xs font-semibold text-red-500 mb-4">Stopped</p>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Successful Qty</Label>
            <Input
              type="number" min={0}
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

        <div className="flex gap-2 mt-4">
          <Button onClick={handleSave} className="flex-1 h-8 text-xs bg-blue-500 hover:bg-blue-600 text-white">
            Save
          </Button>
          <Button onClick={() => onOpenChange(false)} variant="destructive" className="flex-1 h-8 text-xs">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
