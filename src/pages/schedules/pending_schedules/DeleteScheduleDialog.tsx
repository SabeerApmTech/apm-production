import { AlertTriangle } from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface DeleteScheduleDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteScheduleDialog({ open, onClose, onConfirm }: DeleteScheduleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-sm w-[calc(100%-2rem)]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <DialogTitle>Delete Schedule</DialogTitle>
          </div>
        </DialogHeader>

        <p className="mt-1 text-sm text-gray-600">
          Are you sure you want to delete this schedule? This action cannot be undone.
        </p>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => { onConfirm(); onClose() }}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
