import * as React from "react"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { FormDialog } from "@/shared/FormDialog"
import { useGetProductionItemOperationsQuery } from "@/store/services/productionItemApi"
import {
  useGetProductStateOperationsQuery,
  useAddProductStateOperationMutation,
} from "@/store/services/productHierarchyApi"
import type { ProductState } from "@/types/productHierarchy"

interface DuplicateStateOperationsDialogProps {
  open: boolean
  onClose: () => void
  sourceState: ProductState | null
  /** Every state under the same product — the target dropdown offers all of these except the
   *  source state itself (duplicating a state's operations onto itself makes no sense). */
  states: ProductState[]
  /** Needed to resolve each source operation's code back to the productionOperationId the add
   *  endpoint actually wants (it only carries a code, not that catalog id). Undefined while the
   *  parent is still resolving it. */
  productionItemId?: number
}

// Copies one state's operations onto another state under the same product — picked from a
// dropdown of that product's other states. Only operations the target doesn't already have (by
// code) are added, so running this twice (or duplicating from two different source states into
// the same target) never creates duplicate rows. The add endpoint only takes one operation at a
// time, so this is a sequential loop rather than one bulk call — if it fails partway, whatever
// was already added stays added and can be finished by re-running the duplicate.
export function DuplicateStateOperationsDialog({ open, onClose, sourceState, states, productionItemId }: DuplicateStateOperationsDialogProps) {
  const [targetStateId, setTargetStateId] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const { data: sourceOperations = [] } = useGetProductStateOperationsQuery(
    sourceState?.productStateId ?? 0, { skip: !open || !sourceState }
  )
  const { data: targetOperations = [] } = useGetProductStateOperationsQuery(
    Number(targetStateId) || 0, { skip: !open || !targetStateId }
  )
  const { data: catalog = [] } = useGetProductionItemOperationsQuery(
    productionItemId ?? 0, { skip: !open || !productionItemId }
  )
  const [addOperation] = useAddProductStateOperationMutation()

  // Resets the form whenever the dialog (re)opens — including for a different source state,
  // since the key includes its id — without an effect; adjusting state during render avoids the
  // extra post-mount render pass a useEffect would cost here.
  const [prevKey, setPrevKey] = React.useState("")
  const key = `${open}:${sourceState?.productStateId ?? ""}`
  if (key !== prevKey) {
    setPrevKey(key)
    if (open) setTargetStateId("")
  }

  const targetOptions = states.filter((s) => s.productStateId !== sourceState?.productStateId)
  const existingCodes = new Set(targetOperations.map((op) => op.operationCode))
  const operationsToCopy = sourceOperations
    .filter((op) => !existingCodes.has(op.operationCode))
    .map((op) => ({ ...op, productionOperationId: catalog.find((c) => c.operationCode === op.operationCode)?.productionOperationId }))
  const canSubmit = !!sourceState && !!targetStateId && operationsToCopy.length > 0

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!canSubmit) return
    setIsSubmitting(true)
    try {
      for (const op of operationsToCopy) {
        if (op.productionOperationId == null) continue
        await addOperation({ productStateId: Number(targetStateId), productionOperationId: op.productionOperationId }).unwrap()
      }
      onClose()
    } catch {
      // Toast middleware already surfaced the error; keep the dialog open so the user can retry —
      // whatever already got added stays added.
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={sourceState ? `Duplicate Operations from ${sourceState.state}` : "Duplicate Operations"}
      onSubmit={handleSubmit}
      submitLabel={isSubmitting ? "Duplicating..." : "Duplicate"}
      submitDisabled={isSubmitting || !canSubmit}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="duplicateTargetState">To State</Label>
        <Select value={targetStateId} onValueChange={setTargetStateId}>
          <SelectTrigger id="duplicateTargetState" autoFocus>
            <SelectValue placeholder={targetOptions.length === 0 ? "No other states yet" : "Select state"} />
          </SelectTrigger>
          <SelectContent>
            {targetOptions.map((s) => (
              <SelectItem key={s.productStateId} value={String(s.productStateId)}>
                {s.state}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {targetStateId && operationsToCopy.length === 0 && (
        <p className="text-sm text-gray-400">
          {sourceState?.state} has no operations that aren't already in the selected state.
        </p>
      )}
    </FormDialog>
  )
}
