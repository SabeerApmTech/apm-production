import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormDialog } from "@/shared/FormDialog"
import type { StoreRecord } from "@/types/store"

interface StoreDialogProps {
  open: boolean
  onClose: () => void
  store?: StoreRecord
  onAdd: (storeName: string) => Promise<void>
  onEdit?: (storeId: number, storeName: string) => Promise<void>
}

export function StoreDialog({ open, onClose, store, onAdd, onEdit }: StoreDialogProps) {
  const isEdit = Boolean(store)

  const [storeName, setStoreName]     = React.useState(store?.storeName ?? "")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Resets the form field whenever the dialog (re)opens, without an effect — adjusting state
  // during render avoids the extra post-mount render pass a useEffect would cost here.
  const [prevOpen, setPrevOpen] = React.useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setStoreName(store?.storeName ?? "")
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!storeName.trim()) return
    setIsSubmitting(true)
    try {
      if (isEdit && store) {
        await onEdit?.(store.storeId, storeName.trim())
      } else {
        await onAdd(storeName.trim())
      }
      onClose()
    } catch {
      // Toast middleware already surfaced the error; keep the dialog open so the user can retry.
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Store" : "Add Store"}
      onSubmit={handleSubmit}
      submitLabel={isSubmitting ? "Saving..." : isEdit ? "Update" : "Save"}
      submitDisabled={isSubmitting || !storeName.trim()}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="storeName">Store Name</Label>
        <Input
          id="storeName"
          placeholder="Enter store name"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          autoFocus
        />
      </div>
    </FormDialog>
  )
}
