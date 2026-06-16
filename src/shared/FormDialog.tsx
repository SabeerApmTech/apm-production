import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface FormDialogProps {
  open: boolean
  onClose: () => void
  title: string
  onSubmit: React.FormEventHandler<HTMLFormElement>
  submitLabel?: string
  submitDisabled?: boolean
  children: React.ReactNode
}

export function FormDialog({
  open,
  onClose,
  title,
  onSubmit,
  submitLabel = "Save",
  submitDisabled = false,
  children,
}: FormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {children}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitDisabled}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
