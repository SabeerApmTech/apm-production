import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ConfirmPriorityDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ConfirmPriorityDialog({ open, onClose, onConfirm }: ConfirmPriorityDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Update Priority Order</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600 mt-1">
          Are you sure you want to save the new priority order? This will reassign priority numbers to all schedules.
        </p>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onConfirm} className="bg-blue-500 hover:bg-blue-600 text-white">
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
