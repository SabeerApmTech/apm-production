import * as React from "react"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Pencil, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { DeleteDialog } from "@/shared/DeleteDialog"
import { LoadingRow } from "@/shared/LoadingRow"
import { DangerIconButton } from "@/shared/DangerIconButton"
import { useSyncedState } from "@/hooks/useSyncedState"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import type { OperationRow, OperationType } from "@/types/product"
import {
  useGetOperationsQuery,
  useAddOperationMutation,
  useEditOperationMutation,
  useDeleteOperationsMutation,
  useReorderOperationsMutation,
} from "@/store/services/productApi"
import { useGetProcessTeamsQuery } from "@/store/services/processTeamApi"

// Must be a stable reference, not an inline `?? []` — useSyncedState resets whenever its source
// argument changes identity, and a fresh `[]` literal computed every render (while `data` is
// still undefined) would look like a new source on every render, looping forever.
const EMPTY_OPERATIONS: OperationRow[] = []

/* ── Process team select — shared between the Add and Edit inline forms ── */
interface ProcessTeamSelectProps {
  value: string
  onChange: (value: string) => void
  options: { processTeamId: number; processTeamName: string }[]
}

function ProcessTeamSelect({ value, onChange, options }: ProcessTeamSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 flex-1 text-sm">
        <SelectValue placeholder="Select process team..." />
      </SelectTrigger>
      <SelectContent>
        {options.map((pt) => (
          <SelectItem key={pt.processTeamId} value={pt.processTeamName} className="text-sm">
            {pt.processTeamName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/* ── Inline add/edit form — same shape for both, just seeded differently ── */
interface OperationFormRowProps {
  seqNo: number
  initialName: string
  initialTeam: string
  processTeamOptions: { processTeamId: number; processTeamName: string }[]
  saving: boolean
  onSave: (name: string, team: string) => void
  onCancel: () => void
  autoFocus?: boolean
}

function OperationFormRow({
  seqNo, initialName, initialTeam, processTeamOptions, saving, onSave, onCancel, autoFocus,
}: OperationFormRowProps) {
  const [name, setName] = React.useState(initialName)
  const [team, setTeam] = React.useState(initialTeam)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  const canSave = !!name.trim() && !!team && !saving

  return (
    <div className="flex flex-col gap-2 border-b border-dashed border-gray-200 bg-blue-50/40 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="w-12 shrink-0 text-center text-sm text-gray-400">{seqNo}</span>
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") onCancel() }}
          placeholder="Enter Operation..."
          disabled={saving}
          className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>
      <div className="flex items-center gap-2 pl-15">
        <span className="shrink-0 text-xs font-medium text-gray-500">Process Team</span>
        <ProcessTeamSelect value={team} onChange={setTeam} options={processTeamOptions} />
        <button
          onClick={() => onSave(name.trim(), team)}
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

interface SortableRowProps {
  op: OperationRow
  seqNo: number
  selected: boolean
  onToggle: (id: number) => void
  onEdit: (id: number) => void
}

function SortableRow({ op, seqNo, selected, onToggle, onEdit }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: op.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform ? CSS.Transform.toString(transform) : undefined,
        transition,
      }}
      className={cn(
        "flex items-center gap-3 border-b border-dashed border-gray-200 px-4 py-2.5 text-sm",
        isDragging ? "z-10 bg-blue-50 opacity-80 shadow-md" : "bg-white hover:bg-gray-50"
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-gray-300 hover:text-gray-500 active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggle(op.id)}
        className="h-4 w-4 cursor-pointer accent-blue-500"
      />
      <span className="w-12 shrink-0 text-center text-gray-400">{seqNo}</span>
      <div className="flex-1 min-w-0">
        <p className="truncate text-gray-700">{op.operationName}</p>
        {op.processTeam && (
          <p className="mt-0.5 truncate text-xs text-gray-400">
            <span className="font-medium">Process Team:</span> {op.processTeam}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onEdit(op.id)}
        aria-label="Edit operation"
        className="shrink-0 text-gray-300 hover:text-blue-500 transition-colors"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

interface OperationsPanelProps {
  productId: number
  className?: string
  onClose?: () => void
}

export function OperationsPanel({ productId, className, onClose }: OperationsPanelProps) {
  const [activeTab, setActiveTab] = React.useState<OperationType>("production")
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set())
  const [isAdding, setIsAdding] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false)

  const { data, isLoading } = useGetOperationsQuery({ productId, operationType: activeTab })
  const { data: processTeams } = useGetProcessTeamsQuery()
  const processTeamOptions = (processTeams ?? []).filter((pt) => pt.isActive)
  const [addOperation, { isLoading: isSaving }] = useAddOperationMutation()
  const [editOperation, { isLoading: isEditSaving }] = useEditOperationMutation()
  const [deleteOperations] = useDeleteOperationsMutation()
  const [reorderOperations] = useReorderOperationsMutation()

  // Mirrors the fetched list but updates immediately on drag so reordering feels instant,
  // rather than waiting for the reorder request to round-trip before the row visually moves.
  const [operations, setLocalOperations] = useSyncedState(data ?? EMPTY_OPERATIONS)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = operations.findIndex((o) => o.id === active.id)
    const newIdx = operations.findIndex((o) => o.id === over.id)
    const reordered = arrayMove(operations, oldIdx, newIdx)
    setLocalOperations(reordered)
    try {
      await reorderOperations({
        productId,
        operationType: activeTab,
        operations: reordered.map((op, i) => ({
          sequenceNo: i + 1, operationName: op.operationName, processTeam: op.processTeam,
        })),
      }).unwrap()
    } catch {
      setLocalOperations(data ?? [])
    }
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  function toggleSelectAll(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedIds(e.target.checked ? new Set(operations.map((o) => o.id)) : new Set())
  }

  async function handleDelete() {
    if (!selectedIds.size) return
    try {
      await deleteOperations({
        productId,
        operationType: activeTab,
        operationIds: [...selectedIds],
      }).unwrap()
    } finally {
      setSelectedIds(new Set())
    }
  }

  async function handleAddSave(name: string, team: string) {
    try {
      await addOperation({ productId, operationType: activeTab, operationName: name, processTeam: team }).unwrap()
      setIsAdding(false)
    } catch {
      // Toast middleware already surfaced the error; keep the form open so the user can retry.
    }
  }

  async function handleEditSave(operationId: number, name: string, team: string) {
    try {
      await editOperation({
        productId, operationType: activeTab, operationId, operationName: name, processTeam: team,
      }).unwrap()
      setEditingId(null)
    } catch {
      // Toast middleware already surfaced the error; keep the form open so the user can retry.
    }
  }

  const allSelected = operations.length > 0 && selectedIds.size === operations.length

  return (
    <div className={cn("flex w-105 shrink-0 self-start max-h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm", className)}>
      {/* Tabs */}
      <div className="flex items-center border-b border-gray-200">
        {(["production", "rework"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab)
              setSelectedIds(new Set())
              setIsAdding(false)
              setEditingId(null)
            }}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors",
              activeTab === tab
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {tab === "production" ? "Production Stage" : "Rework Stage"}
          </button>
        ))}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center mr-2 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-2 border-b border-gray-100 px-4 py-2">
        <DangerIconButton onClick={() => setDeleteConfirmOpen(true)} count={selectedIds.size} size="sm" />
        <div className="flex-1" />
        <button
          onClick={() => { setIsAdding(true); setEditingId(null) }}
          className="rounded-lg bg-blue-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
        >
          ADD
        </button>
      </div>

      {/* Table header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-500">
        <span className="w-4" />
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleSelectAll}
          className="h-4 w-4 cursor-pointer accent-blue-500"
        />
        <span className="w-12 text-center">Seq. No</span>
        <span className="flex-1">Operation &amp; Process Team</span>
      </div>

      {/* Sortable list */}
      <div className="flex-1 overflow-y-auto">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={operations.map((o) => o.id)} strategy={verticalListSortingStrategy}>
            {operations.map((op, i) => (
              editingId === op.id ? (
                <OperationFormRow
                  key={op.id}
                  seqNo={i + 1}
                  initialName={op.operationName}
                  initialTeam={op.processTeam}
                  processTeamOptions={processTeamOptions}
                  saving={isEditSaving}
                  onSave={(name, team) => handleEditSave(op.id, name, team)}
                  onCancel={() => setEditingId(null)}
                  autoFocus
                />
              ) : (
                <SortableRow
                  key={op.id}
                  op={op}
                  seqNo={i + 1}
                  selected={selectedIds.has(op.id)}
                  onToggle={toggleSelect}
                  onEdit={(id) => { setEditingId(id); setIsAdding(false) }}
                />
              )
            ))}
          </SortableContext>
        </DndContext>

        {/* Inline add row */}
        {isAdding && (
          <OperationFormRow
            seqNo={operations.length + 1}
            initialName=""
            initialTeam=""
            processTeamOptions={processTeamOptions}
            saving={isSaving}
            onSave={handleAddSave}
            onCancel={() => setIsAdding(false)}
            autoFocus
          />
        )}

        {isLoading && (
          <LoadingRow label="Loading operations…" className="justify-center py-12 text-gray-400" />
        )}

        {!isLoading && operations.length === 0 && !isAdding && (
          <div className="flex items-center justify-center py-12 text-sm text-gray-400">
            No operations yet. Click ADD to create one.
          </div>
        )}
      </div>

      <DeleteDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Operations"
        description={`Are you sure you want to delete the selected operation${selectedIds.size > 1 ? "s" : ""}? This action cannot be undone.`}
      />
    </div>
  )
}
