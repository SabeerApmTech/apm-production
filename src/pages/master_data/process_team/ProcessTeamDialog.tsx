import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormDialog } from "@/shared/FormDialog"
import type { ProcessTeamRecord } from "@/types/processTeam"

interface ProcessTeamDialogProps {
  open: boolean
  onClose: () => void
  processTeam?: ProcessTeamRecord
  onAdd: (processTeamName: string) => Promise<void>
  onEdit?: (processTeamId: number, processTeamName: string) => Promise<void>
}

export function ProcessTeamDialog({ open, onClose, processTeam, onAdd, onEdit }: ProcessTeamDialogProps) {
  const isEdit = Boolean(processTeam)

  const [processTeamName, setProcessTeamName] = React.useState(processTeam?.processTeamName ?? "")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Resets the form field whenever the dialog (re)opens, without an effect — adjusting state
  // during render avoids the extra post-mount render pass a useEffect would cost here.
  const [prevOpen, setPrevOpen] = React.useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setProcessTeamName(processTeam?.processTeamName ?? "")
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!processTeamName.trim()) return
    setIsSubmitting(true)
    try {
      if (isEdit && processTeam) {
        await onEdit?.(processTeam.processTeamId, processTeamName.trim())
      } else {
        await onAdd(processTeamName.trim())
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
      title={isEdit ? "Edit Process Team" : "Add Process Team"}
      onSubmit={handleSubmit}
      submitLabel={isSubmitting ? "Saving..." : isEdit ? "Update" : "Save"}
      submitDisabled={isSubmitting || !processTeamName.trim()}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="processTeamName">Process Team Name</Label>
        <Input
          id="processTeamName"
          placeholder="Enter process team name"
          value={processTeamName}
          onChange={(e) => setProcessTeamName(e.target.value)}
          autoFocus
        />
      </div>
    </FormDialog>
  )
}
