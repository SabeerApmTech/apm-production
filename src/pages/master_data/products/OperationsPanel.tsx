import { useState } from "react"
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core"
import type { DragEndEvent } from "@dnd-kit/core"
import {
  SortableContext, arrayMove, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { DeleteDialog } from "@/shared/DeleteDialog"
import { DangerIconButton } from "@/shared/DangerIconButton"
import { LoadingRow } from "@/shared/LoadingRow"
import { useSyncedState } from "@/hooks/useSyncedState"
import { useGetProductionItemOperationsQuery } from "@/store/services/productionItemApi"
import {
  useGetProductStateOperationsQuery,
  useAddProductStateOperationMutation,
  useDeleteProductStateOperationsMutation,
  useReorderProductStateOperationsMutation,
} from "@/store/services/productHierarchyApi"
import type { ProductStateOperation } from "@/types/productHierarchy"

const EMPTY_OPERATIONS: ProductStateOperation[] = []

function AddOperationForm({ seqNo, productionItemId, existingCodes, saving, onSave, onCancel }: {
  seqNo: number
  productionItemId?: number
  /** Codes already present in this state — offering them again would just create a duplicate. */
  existingCodes: Set<string>
  saving: boolean
  onSave: (productionOperationId: number) => Promise<void>
  onCancel: () => void
}) {
  const [selectedId, setSelectedId] = useState("")
  const { data: stages = [], isLoading, isError } = useGetProductionItemOperationsQuery(
    productionItemId ?? 0, { skip: !productionItemId }
  )
  const options = stages.filter((s) => !existingCodes.has(s.operationCode))
  const canSave = !saving && !!selectedId

  async function submit() {
    if (canSave) await onSave(Number(selectedId))
  }

  return (
    <div className="flex items-center gap-2 border-b border-dashed border-gray-200 bg-blue-50/40 px-4 py-3">
      <span className="w-6 shrink-0" />
      <span className="w-12 shrink-0 text-center text-sm text-gray-400">{seqNo}</span>
      <Select value={selectedId} onValueChange={setSelectedId} disabled={saving || !productionItemId}>
        <SelectTrigger aria-label="Operation" className="min-w-0 flex-1" autoFocus>
          <SelectValue placeholder={
            !productionItemId ? "Loading production stages..."
              : isLoading ? "Loading production stages..."
              : "Select operation"
          } />
        </SelectTrigger>
        <SelectContent>
          {options.map((s) => (
            <SelectItem key={s.productionOperationId} value={String(s.productionOperationId)}>
              {s.operationCode} - {s.operationName}
            </SelectItem>
          ))}
          {!isLoading && !isError && options.length === 0 && (
            <div className="px-2 py-1.5 text-sm text-gray-400">No production stages left to add</div>
          )}
        </SelectContent>
      </Select>
      <Button type="button" size="sm" disabled={!canSave} onClick={submit}>{saving ? "Saving..." : "Save"}</Button>
      <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
    </div>
  )
}

/** One draggable operation row — the grip handle (not the row itself) carries the drag
 *  listeners, so clicking the checkbox or the row otherwise never accidentally starts a drag. */
function SortableOperationRow({ op, seqNo, checked, onToggle, dragDisabled }: {
  op: ProductStateOperation
  /** Its position in the (possibly still-optimistic) local order — shown instead of the
   *  server's own sequenceNumber so a just-dropped row reflects its new spot immediately. */
  seqNo: number
  checked: boolean
  onToggle: () => void
  dragDisabled: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: op.productStateOperationId, disabled: dragDisabled,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-3 border-b border-dashed border-gray-200 bg-white px-4 py-2.5 text-sm hover:bg-gray-50",
        isDragging && "relative z-10 shadow-md"
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        disabled={dragDisabled}
        aria-label={`Drag to reorder ${op.operationCode}`}
        className="flex h-6 w-6 shrink-0 touch-none items-center justify-center text-gray-300 hover:text-gray-500 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40 cursor-grab"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <input
        type="checkbox"
        aria-label={`Select operation ${op.operationCode}`}
        checked={checked}
        onChange={onToggle}
        className="h-4 w-4 cursor-pointer accent-blue-500"
      />
      <span className="w-12 shrink-0 text-center text-gray-400">{seqNo}</span>
      <span className="w-20 shrink-0 wrap-break-word text-gray-700">{op.operationCode}</span>
      <p className="min-w-0 flex-1 truncate text-gray-700">{op.operationName}</p>
    </div>
  )
}

interface OperationsPanelProps {
  productStateId: number
  /** The production item this product is based on — its own Production Stage catalog is what
   *  the "add operation" dropdown offers. Undefined while the parent is still resolving it. */
  productionItemId?: number
  stateName?: string
  className?: string
  onClose?: () => void
}

// The bottom rung of the Products → States → Operations drill-down. Unlike the states level,
// the API gives no PUT for a single operation — only add-one (POST, by productionOperationId,
// appended at the end), bulk delete (DELETE, by id), and reorder (PUT, a full sequenceNumber +
// productStateOperationId list) — so there's no in-place edit of an operation's own fields here,
// just add/delete/reorder.
export function OperationsPanel({ productStateId, productionItemId, className, onClose }: OperationsPanelProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [isAdding, setIsAdding] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data, isLoading, isError, refetch } = useGetProductStateOperationsQuery(productStateId)
  const operations = data ?? EMPTY_OPERATIONS
  // Reordering is optimistic — the dropped-into order shows immediately rather than waiting on
  // the round trip, and reverts on its own (see handleDragEnd's catch) if the save fails.
  const [localOperations, setLocalOperations] = useSyncedState(operations)

  const [addOperation, { isLoading: adding }] = useAddProductStateOperationMutation()
  const [deleteOperations, { isLoading: deleting }] = useDeleteProductStateOperationsMutation()
  const [reorderOperations, { isLoading: reordering }] = useReorderProductStateOperationsMutation()
  const busy = adding || deleting || reordering

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedIds(checked ? new Set(operations.map((op) => op.productStateOperationId)) : new Set())
  }

  async function handleAddSave(productionOperationId: number) {
    try {
      await addOperation({ productStateId, productionOperationId }).unwrap()
      setIsAdding(false)
    } catch {
      // Toast middleware already surfaced the error; keep the form open so the user can retry.
    }
  }

  async function handleDelete() {
    if (!selectedIds.size) return
    try {
      await deleteOperations({ productStateId, productStateOperationIds: [...selectedIds] }).unwrap()
      setSelectedIds(new Set())
    } catch {
      // Keep the selection so the failed deletion can be retried.
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = localOperations.findIndex((op) => op.productStateOperationId === active.id)
    const newIndex = localOperations.findIndex((op) => op.productStateOperationId === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(localOperations, oldIndex, newIndex)
    setLocalOperations(reordered)
    try {
      await reorderOperations({
        productStateId,
        items: reordered.map((op, i) => ({ sequenceNumber: i + 1, productStateOperationId: op.productStateOperationId })),
      }).unwrap()
    } catch {
      // Toast middleware already surfaced the error — a failed save doesn't invalidate the query
      // (nothing to refetch), so revert the optimistic order back to the last known-good one.
      setLocalOperations(operations)
    }
  }

  const allSelected = operations.length > 0 && selectedIds.size === operations.length
  const existingCodes = new Set(operations.map((op) => op.operationCode))

  return (
    <div className={cn("flex w-105 shrink-0 self-start max-h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm", className)}>
      <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-700">Operations</h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close operations"
            disabled={busy}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 border-b border-gray-100 px-4 py-2">
        <DangerIconButton onClick={() => setConfirmDelete(true)} count={busy ? 0 : selectedIds.size} size="sm" title="Delete selected operations" />
        <div className="flex-1" />
        <Button type="button" size="sm" disabled={busy || isAdding} onClick={() => setIsAdding(true)}>Add Operations</Button>
      </div>

      <div className="flex shrink-0 items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500">
        <span className="w-6 shrink-0" />
        <input
          type="checkbox"
          aria-label="Select all operations"
          checked={allSelected}
          onChange={(e) => toggleSelectAll(e.target.checked)}
          className="h-4 w-4 cursor-pointer accent-blue-500"
        />
        <span className="w-12 text-center">Seq. No</span>
        <span className="w-20 shrink-0">Code</span>
        <span className="flex-1">Operation Name</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => void handleDragEnd(e)}>
          <SortableContext
            items={localOperations.map((op) => op.productStateOperationId)}
            strategy={verticalListSortingStrategy}
          >
            {localOperations.map((op, index) => (
              <SortableOperationRow
                key={op.productStateOperationId}
                op={op}
                seqNo={index + 1}
                checked={selectedIds.has(op.productStateOperationId)}
                onToggle={() => toggleSelect(op.productStateOperationId)}
                dragDisabled={busy}
              />
            ))}
          </SortableContext>
        </DndContext>

        {isAdding && (
          <AddOperationForm
            seqNo={operations.length + 1}
            productionItemId={productionItemId}
            existingCodes={existingCodes}
            saving={adding}
            onSave={handleAddSave}
            onCancel={() => setIsAdding(false)}
          />
        )}

        {isLoading && <LoadingRow label="Loading operations…" className="justify-center py-12 text-gray-400" />}

        {isError && (
          <div role="alert" className="p-4 text-sm text-red-600">
            Unable to load operations. <button type="button" className="underline" onClick={() => void refetch()}>Retry</button>
          </div>
        )}

        {!isLoading && !isError && operations.length === 0 && !isAdding && (
          <div className="flex items-center justify-center py-12 text-sm text-gray-400">
            No operations yet. Click Add Operations to create one.
          </div>
        )}
      </div>

      <DeleteDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete Operations"
        description={`Are you sure you want to delete the selected operation${selectedIds.size > 1 ? "s" : ""}? This action cannot be undone.`}
      />
    </div>
  )
}
