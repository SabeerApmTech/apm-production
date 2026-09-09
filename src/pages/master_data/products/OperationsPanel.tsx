import { useState, type FormEvent } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DeleteDialog } from "@/shared/DeleteDialog"
import { DangerIconButton } from "@/shared/DangerIconButton"
import { LoadingRow } from "@/shared/LoadingRow"
import {
  useGetProductStateOperationsQuery,
  useAddProductStateOperationsMutation,
  useDeleteProductStateOperationsMutation,
} from "@/store/services/productHierarchyApi"

function AddOperationForm({ seqNo, saving, onSave, onCancel }: {
  seqNo: number
  saving: boolean
  onSave: (operationCode: string) => Promise<void>
  onCancel: () => void
}) {
  const [code, setCode] = useState("")
  const canSave = !saving && !!code.trim()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (canSave) void onSave(code.trim())
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2 border-b border-dashed border-gray-200 bg-blue-50/40 px-4 py-3">
      <span className="w-12 shrink-0 text-center text-sm text-gray-400">{seqNo}</span>
      <Input
        aria-label="Operation Code"
        placeholder="Enter operation code"
        className="min-w-0 flex-1"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Escape") onCancel() }}
        disabled={saving}
        autoFocus
      />
      <Button type="submit" size="sm" disabled={!canSave}>{saving ? "Saving..." : "Save"}</Button>
      <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
    </form>
  )
}

interface OperationsPanelProps {
  productStateId: number
  stateName?: string
  className?: string
  onClose?: () => void
}

// The bottom rung of the Products → States → Operations drill-down. Unlike the states level,
// the API gives no PUT for a single operation — only bulk add (POST, with a sequence number +
// code per item) and bulk delete (DELETE, by id) — so there's no inline edit here, just add/delete.
export function OperationsPanel({ productStateId, className, onClose }: OperationsPanelProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [isAdding, setIsAdding] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data: operations = [], isLoading, isError, refetch } = useGetProductStateOperationsQuery(productStateId)
  const [addOperations, { isLoading: adding }] = useAddProductStateOperationsMutation()
  const [deleteOperations, { isLoading: deleting }] = useDeleteProductStateOperationsMutation()
  const busy = adding || deleting

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedIds(checked ? new Set(operations.map((op) => op.productionOperationId)) : new Set())
  }

  async function handleAddSave(operationCode: string) {
    try {
      await addOperations({
        productStateId,
        items: [{ sequenceNo: operations.length + 1, operationCode }],
      }).unwrap()
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

  const allSelected = operations.length > 0 && selectedIds.size === operations.length

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
        <Button type="button" size="sm" disabled={busy} onClick={() => setIsAdding(true)}>Add Operations</Button>
      </div>

      <div className="flex shrink-0 items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500">
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
        {operations.map((op) => (
          <div key={op.productionOperationId} className="flex items-center gap-3 border-b border-dashed border-gray-200 px-4 py-2.5 text-sm hover:bg-gray-50">
            <input
              type="checkbox"
              aria-label={`Select operation ${op.operationCode}`}
              checked={selectedIds.has(op.productionOperationId)}
              onChange={() => toggleSelect(op.productionOperationId)}
              className="h-4 w-4 cursor-pointer accent-blue-500"
            />
            <span className="w-12 shrink-0 text-center text-gray-400">{op.sequenceNumber}</span>
            <span className="w-20 shrink-0 break-words text-gray-700">{op.operationCode}</span>
            <p className="min-w-0 flex-1 truncate text-gray-700">{op.operationName}</p>
          </div>
        ))}

        {isAdding && (
          <AddOperationForm seqNo={operations.length + 1} saving={adding} onSave={handleAddSave} onCancel={() => setIsAdding(false)} />
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
