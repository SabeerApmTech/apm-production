import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PAUSE_REASONS } from "./data"

const textareaClass =
  "w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"

interface PauseFormData { reason: string; remarks: string }

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: PauseFormData) => void
}

export function PauseDialog({ open, onOpenChange, onSubmit }: Props) {
  const [form, setForm] = useState<PauseFormData>({ reason: "", remarks: "" })

  const handleSubmit = () => {
    onSubmit(form)
    setForm({ reason: "", remarks: "" })
  }

  const handleCancel = () => {
    onOpenChange(false)
    setForm({ reason: "", remarks: "" })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold text-gray-800">Pause Operation</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Reason</Label>
            <Select value={form.reason} onValueChange={v => setForm(f => ({ ...f, reason: v }))}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select reason..." />
              </SelectTrigger>
              <SelectContent>
                {PAUSE_REASONS.map(r => (
                  <SelectItem key={r} value={r} className="text-sm">{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <Button onClick={handleCancel} variant="outline" className="flex-1 h-8 text-xs">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!form.reason}
            variant="destructive"
            className="flex-1 h-8 text-xs"
          >
            Submit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
