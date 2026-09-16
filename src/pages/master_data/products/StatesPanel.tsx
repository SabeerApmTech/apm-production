import { useState, type FormEvent } from "react"
import { Copy, Pencil, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Drawer } from "@/components/ui/drawer"
import { DeleteDialog } from "@/shared/DeleteDialog"
import { DangerIconButton } from "@/shared/DangerIconButton"
import { LoadingRow } from "@/shared/LoadingRow"
import { useIsMobile } from "@/hooks/useIsMobile"
import { OperationsPanel } from "./OperationsPanel"
import { DuplicateStateOperationsDialog } from "./DuplicateStateOperationsDialog"
import {
  useGetProductStatesQuery,
  useCreateProductStateMutation,
  useUpdateProductStateMutation,
  useDeleteProductStateMutation,
  useGetProductStateOperationsQuery,
} from "@/store/services/productHierarchyApi"
import type { ProductState } from "@/types/productHierarchy"

/** Shows the state's operation count without the parent list needing to fetch every state's
 * operations up front — one small cached query per row, same idea as a per-row stats cell. */
function OperationsCountCell({ productStateId }: { productStateId: number }) {
  const { data } = useGetProductStateOperationsQuery(productStateId)
  return <span>{data ? data.length : "—"}</span>
}

function StateForm({ initialState, saving, onSave, onCancel }: {
  initialState: string
  saving: boolean
  onSave: (state: string) => Promise<void>
  onCancel: () => void
}) {
  const [state, setState] = useState(initialState)
  const canSave = !saving && !!state.trim()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (canSave) void onSave(state.trim())
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2 border-b border-dashed border-gray-200 bg-blue-50/40 px-4 py-3">
      <Input
        aria-label="State"
        placeholder="Enter state"
        className="min-w-0 flex-1"
        value={state}
        onChange={(e) => setState(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Escape") onCancel() }}
        disabled={saving}
        autoFocus
      />
      <Button type="submit" size="sm" disabled={!canSave}>{saving ? "Saving..." : "Save"}</Button>
      <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
    </form>
  )
}

interface StatesPanelProps {
  productId: number
  /** The production item this product is based on — passed through to Operations so its
   *  "add operation" dropdown can offer that item's own Production Stage catalog. Undefined
   *  until the production-items list (fetched by the parent) resolves it. */
  productionItemId?: number
  className?: string
  onClose?: () => void
}

export function StatesPanel({ productId, productionItemId, className, onClose }: StatesPanelProps) {
  const isMobile = useIsMobile()
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [editingId, setEditingId] = useState<number | "new" | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null)
  const [duplicatingState, setDuplicatingState] = useState<ProductState | null>(null)

  const { data: states = [], isLoading, isError, refetch } = useGetProductStatesQuery(productId)
  const [createState, { isLoading: creating }] = useCreateProductStateMutation()
  const [updateState, { isLoading: updating }] = useUpdateProductStateMutation()
  const [deleteState, { isLoading: deleting }] = useDeleteProductStateMutation()
  const busy = creating || updating || deleting

  const selectedState = states.find((s) => s.productStateId === selectedStateId) ?? null
  const selected = states.filter((s) => selectedIds.has(s.productStateId)).map((s) => s.productStateId)

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function save(state: string) {
    try {
      if (editingId === "new") await createState({ productId, state }).unwrap()
      else if (editingId !== null) await updateState({ productStateId: editingId, body: { productId, state } }).unwrap()
      setEditingId(null)
    } catch {
      // Toast middleware already surfaced the error; keep the form open so the user can retry.
    }
  }

  async function deleteSelected() {
    if (!selected.length) return
    try {
      for (const productStateId of selected) {
        await deleteState({ productStateId, productId }).unwrap()
      }
      if (selectedStateId !== null && selected.includes(selectedStateId)) setSelectedStateId(null)
      setSelectedIds(new Set())
    } catch {
      // Toast middleware already surfaced the error; the list reflects the server's actual state on refetch.
    }
  }

  function selectRow(state: ProductState) {
    setSelectedStateId((prev) => (prev === state.productStateId ? null : state.productStateId))
  }

  const allSelected = states.length > 0 && selected.length === states.length

  return (
    <>
      {/* Operations renders stacked below States (not beside it) — this wrapper is the thing
          that's actually positioned as the sibling column next to the Products table; each
          card inside sizes to its own content instead of stretching to fill it. */}
      <div className={cn("flex w-105 shrink-0 self-start flex-col gap-4", className)}>
        <div className="flex w-full shrink-0 max-h-125 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-700">State</h3>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close states"
                disabled={busy}
                className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2 border-b border-gray-100 px-4 py-2">
            <DangerIconButton onClick={() => setConfirmDelete(true)} count={busy ? 0 : selected.length} size="sm" title="Delete selected states" />
            <div className="flex-1" />
            <Button type="button" size="sm" disabled={busy} onClick={() => setEditingId("new")}>Add State</Button>
          </div>

          <div className="flex shrink-0 items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500">
            <input
              type="checkbox"
              aria-label="Select all states"
              checked={allSelected}
              onChange={(e) => setSelectedIds(e.target.checked ? new Set(states.map((s) => s.productStateId)) : new Set())}
              className="h-4 w-4 cursor-pointer accent-blue-500"
            />
            <span className="flex-1">State</span>
            <span className="w-28 shrink-0 text-center">No of Operations</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {editingId === "new" && (
              <StateForm initialState="" saving={creating} onSave={save} onCancel={() => setEditingId(null)} />
            )}

            {states.map((s) => (
              editingId === s.productStateId ? (
                <StateForm key={s.productStateId} initialState={s.state} saving={updating} onSave={save} onCancel={() => setEditingId(null)} />
              ) : (
                <div
                  key={s.productStateId}
                  onClick={() => selectRow(s)}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 border-b border-dashed border-gray-200 px-4 py-2.5 text-sm hover:bg-gray-50",
                    selectedStateId === s.productStateId && "bg-blue-50 hover:bg-blue-50"
                  )}
                >
                  <input
                    type="checkbox"
                    aria-label={`Select state ${s.state}`}
                    checked={selectedIds.has(s.productStateId)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => toggleSelect(s.productStateId)}
                    className="h-4 w-4 cursor-pointer accent-blue-500"
                  />
                  <p className="min-w-0 flex-1 truncate text-gray-700">{s.state}</p>
                  <span className="w-28 shrink-0 text-center text-gray-500">
                    <OperationsCountCell productStateId={s.productStateId} />
                  </span>
                  <button
                    type="button"
                    aria-label={`Duplicate operations from ${s.state}`}
                    disabled={busy}
                    onClick={(e) => { e.stopPropagation(); setDuplicatingState(s) }}
                    className="shrink-0 text-gray-300 hover:text-blue-500 transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Edit state ${s.state}`}
                    disabled={busy}
                    onClick={(e) => { e.stopPropagation(); setEditingId(s.productStateId) }}
                    className="shrink-0 text-gray-300 hover:text-blue-500 transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              )
            ))}

            {isLoading && <LoadingRow label="Loading states…" className="justify-center py-12 text-gray-400" />}

            {isError && (
              <div role="alert" className="p-4 text-sm text-red-600">
                Unable to load states. <button type="button" className="underline" onClick={() => void refetch()}>Retry</button>
              </div>
            )}

            {!isLoading && !isError && states.length === 0 && editingId !== "new" && (
              <div className="flex items-center justify-center py-12 text-sm text-gray-400">
                No states yet. Click Add State to create one.
              </div>
            )}
          </div>
        </div>

        {selectedState && !isMobile && (
          <OperationsPanel
            key={selectedState.productStateId}
            productStateId={selectedState.productStateId}
            productionItemId={productionItemId}
            stateName={selectedState.state}
            onClose={() => setSelectedStateId(null)}
            className="w-full self-stretch max-h-125"
          />
        )}
      </div>

      {isMobile && (
        <Drawer
          open={selectedState !== null}
          onClose={() => setSelectedStateId(null)}
          title={selectedState?.state ?? "Operations"}
        >
          {selectedState && (
            <OperationsPanel
              key={selectedState.productStateId}
              productStateId={selectedState.productStateId}
              productionItemId={productionItemId}
              stateName={selectedState.state}
              className="w-full self-auto max-h-none border-0 shadow-none rounded-none"
            />
          )}
        </Drawer>
      )}

      <DeleteDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={deleteSelected}
        title="Delete States"
        description={`Are you sure you want to delete the selected state${selected.length > 1 ? "s" : ""}? This action cannot be undone.`}
      />

      <DuplicateStateOperationsDialog
        key={duplicatingState?.productStateId ?? "none"}
        open={duplicatingState !== null}
        onClose={() => setDuplicatingState(null)}
        sourceState={duplicatingState}
        states={states}
        productionItemId={productionItemId}
      />
    </>
  )
}
