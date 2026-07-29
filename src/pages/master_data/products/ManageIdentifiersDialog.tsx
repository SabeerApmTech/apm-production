import * as React from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DeleteDialog } from "@/shared/DeleteDialog"
import { LoadingRow } from "@/shared/LoadingRow"
import {
  useGetIdentifiersQuery,
  useCreateIdentifierMutation,
  useUpdateIdentifierMutation,
  useDeleteIdentifierMutation,
} from "@/store/services/productApi"

interface IdentifierFormValues {
  identifierName: string
  minLength: number
  maxLength: number
  isDigitsOnly: boolean
}

/* ── Inline add/edit row — same shape for both, just seeded differently ── */
interface IdentifierRowFormProps {
  initial: IdentifierFormValues
  saving: boolean
  onSave: (values: IdentifierFormValues) => void
  onCancel: () => void
  autoFocus?: boolean
}

function IdentifierRowForm({ initial, saving, onSave, onCancel, autoFocus }: IdentifierRowFormProps) {
  const [name, setName] = React.useState(initial.identifierName)
  const [minLength, setMinLength] = React.useState(String(initial.minLength))
  const [maxLength, setMaxLength] = React.useState(String(initial.maxLength))
  const [isDigitsOnly, setIsDigitsOnly] = React.useState(initial.isDigitsOnly)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  const canSave = !!name.trim() && minLength !== "" && maxLength !== "" && Number(minLength) <= Number(maxLength) && !saving

  function handleSave() {
    if (!canSave) return
    onSave({ identifierName: name.trim(), minLength: Number(minLength), maxLength: Number(maxLength), isDigitsOnly })
  }

  return (
    <div className="flex flex-col gap-2 border-b border-dashed border-gray-200 bg-blue-50/40 px-4 py-3">
      <input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Escape") onCancel() }}
        placeholder="Enter identifier name..."
        disabled={saving}
        className="rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <label className="flex items-center gap-1.5">
          Min Length
          <input
            type="number" min={0} value={minLength}
            onChange={(e) => setMinLength(e.target.value)}
            disabled={saving}
            className="w-16 rounded border border-gray-200 px-1.5 py-1 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="flex items-center gap-1.5">
          Max Length
          <input
            type="number" min={0} value={maxLength}
            onChange={(e) => setMaxLength(e.target.value)}
            disabled={saving}
            className="w-16 rounded border border-gray-200 px-1.5 py-1 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={isDigitsOnly}
            onChange={(e) => setIsDigitsOnly(e.target.checked)}
            disabled={saving}
            className="h-4 w-4 cursor-pointer accent-blue-500"
          />
          Digits Only
        </label>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="shrink-0 rounded bg-blue-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="shrink-0 rounded px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

interface ManageIdentifiersDialogProps {
  open: boolean
  onClose: () => void
}

export function ManageIdentifiersDialog({ open, onClose }: ManageIdentifiersDialogProps) {
  const { data, isLoading } = useGetIdentifiersQuery(undefined, { skip: !open })
  const identifiers = data ?? []

  const [createIdentifier, { isLoading: isCreating }] = useCreateIdentifierMutation()
  const [updateIdentifier, { isLoading: isUpdating }] = useUpdateIdentifierMutation()
  const [deleteIdentifier] = useDeleteIdentifierMutation()

  const [isAdding, setIsAdding] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [deleteId, setDeleteId] = React.useState<number | null>(null)

  async function handleAddSave(values: IdentifierFormValues) {
    try {
      await createIdentifier(values).unwrap()
      setIsAdding(false)
    } catch {
      // Toast middleware already surfaced the error; keep the form open so the user can retry.
    }
  }

  async function handleEditSave(identifierTypeId: number, values: IdentifierFormValues) {
    try {
      await updateIdentifier({ identifierTypeId, body: values }).unwrap()
      setEditingId(null)
    } catch {
      // Toast middleware already surfaced the error; keep the form open so the user can retry.
    }
  }

  async function handleDelete() {
    if (deleteId === null) return
    try {
      await deleteIdentifier(deleteId).unwrap()
    } catch {
      // Toast middleware already surfaced the error; the list reflects the server's actual state on refetch.
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Identifiers</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => { setIsAdding(true); setEditingId(null) }}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Plus className="h-4 w-4 mr-1" /> Add Identifier
              </Button>
            </div>

            <div className="max-h-80 overflow-y-auto rounded-lg border border-gray-200">
              {isAdding && (
                <IdentifierRowForm
                  initial={{ identifierName: "", minLength: 0, maxLength: 0, isDigitsOnly: false }}
                  saving={isCreating}
                  onSave={handleAddSave}
                  onCancel={() => setIsAdding(false)}
                  autoFocus
                />
              )}

              {identifiers.map((identifier) => (
                editingId === identifier.identifierTypeId ? (
                  <IdentifierRowForm
                    key={identifier.identifierTypeId}
                    initial={identifier}
                    saving={isUpdating}
                    onSave={(values) => handleEditSave(identifier.identifierTypeId, values)}
                    onCancel={() => setEditingId(null)}
                    autoFocus
                  />
                ) : (
                  <div
                    key={identifier.identifierTypeId}
                    className="flex items-center gap-3 border-b border-dashed border-gray-200 px-4 py-2.5 text-sm last:border-b-0 hover:bg-gray-50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-gray-700">{identifier.identifierName}</p>
                      <p className="mt-0.5 truncate text-xs text-gray-400">
                        Length {identifier.minLength}-{identifier.maxLength}
                        {identifier.isDigitsOnly ? " · Digits only" : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setEditingId(identifier.identifierTypeId); setIsAdding(false) }}
                      aria-label="Edit identifier"
                      className="shrink-0 text-gray-300 hover:text-blue-500 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteId(identifier.identifierTypeId)}
                      aria-label="Delete identifier"
                      className="shrink-0 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
              ))}

              {isLoading && (
                <LoadingRow label="Loading identifiers…" className="justify-center py-8 text-gray-400" />
              )}

              {!isLoading && identifiers.length === 0 && !isAdding && (
                <div className="flex items-center justify-center py-8 text-sm text-gray-400">
                  No identifiers yet. Click Add Identifier to create one.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Identifier"
        description="Are you sure you want to delete this identifier? This action cannot be undone."
      />
    </>
  )
}
