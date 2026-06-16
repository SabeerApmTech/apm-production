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
import { GripVertical, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Operation, ProductRow } from "./Products"

type StageType = "production" | "rework"

interface SortableRowProps {
  op: Operation
  seqNo: number
  selected: boolean
  onToggle: (id: string) => void
}

function SortableRow({ op, seqNo, selected, onToggle }: SortableRowProps) {
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
      <span className="flex-1 text-gray-700">{op.operation}</span>
    </div>
  )
}

interface OperationsPanelProps {
  product: ProductRow
  onUpdate: (type: StageType, ops: Operation[]) => void
  className?: string
}

export function OperationsPanel({ product, onUpdate, className }: OperationsPanelProps) {
  const [activeTab, setActiveTab]   = React.useState<StageType>("production")
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [isAdding, setIsAdding]     = React.useState(false)
  const [newOpText, setNewOpText]   = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (isAdding) inputRef.current?.focus()
  }, [isAdding])

  const operations = activeTab === "production" ? product.productionStages : product.reworkStages

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = operations.findIndex((o) => o.id === active.id)
    const newIdx = operations.findIndex((o) => o.id === over.id)
    onUpdate(activeTab, arrayMove(operations, oldIdx, newIdx))
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  function toggleSelectAll(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedIds(e.target.checked ? new Set(operations.map((o) => o.id)) : new Set())
  }

  function handleDelete() {
    onUpdate(activeTab, operations.filter((o) => !selectedIds.has(o.id)))
    setSelectedIds(new Set())
  }

  function handleSave() {
    const text = newOpText.trim()
    if (!text) return
    const newOp: Operation = {
      id: `${activeTab[0]}${product.id}-${Date.now()}`,
      operation: text,
    }
    onUpdate(activeTab, [...operations, newOp])
    setNewOpText("")
    setIsAdding(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSave()
    if (e.key === "Escape") { setIsAdding(false); setNewOpText("") }
  }

  const allSelected = operations.length > 0 && selectedIds.size === operations.length

  return (
    <div className={cn("flex w-105 shrink-0 self-start max-h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm", className)}>
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(["production", "rework"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab)
              setSelectedIds(new Set())
              setIsAdding(false)
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
      </div>

      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-2 border-b border-gray-100 px-4 py-2">
        <button
          onClick={handleDelete}
          disabled={selectedIds.size === 0}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg border transition-all",
            selectedIds.size > 0
              ? "border-red-400 bg-red-500 text-white hover:bg-red-600"
              : "border-red-200 bg-red-50 text-red-300 cursor-default"
          )}
        >
          <Trash2 className="h-4 w-4" />
        </button>
        {selectedIds.size > 0 && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-100 px-1.5 text-xs font-bold text-red-600">
            {selectedIds.size}
          </span>
        )}
        <div className="flex-1" />
        <button
          onClick={() => setIsAdding(true)}
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
        <span className="flex-1">Operation</span>
      </div>

      {/* Sortable list */}
      <div className="flex-1 overflow-y-auto">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={operations.map((o) => o.id)} strategy={verticalListSortingStrategy}>
            {operations.map((op, i) => (
              <SortableRow
                key={op.id}
                op={op}
                seqNo={i + 1}
                selected={selectedIds.has(op.id)}
                onToggle={toggleSelect}
              />
            ))}
          </SortableContext>
        </DndContext>

        {/* Inline add row */}
        {isAdding && (
          <div className="flex items-center gap-3 border-b border-dashed border-gray-200 px-4 py-2">
            <span className="w-4" />
            <input type="checkbox" disabled className="h-4 w-4 opacity-30 accent-blue-500" />
            <span className="w-12 shrink-0 text-center text-sm text-gray-400">
              {operations.length + 1}
            </span>
            <input
              ref={inputRef}
              value={newOpText}
              onChange={(e) => setNewOpText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter Operation..."
              className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <button
              onClick={handleSave}
              disabled={!newOpText.trim()}
              className="rounded bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              Save
            </button>
          </div>
        )}

        {operations.length === 0 && !isAdding && (
          <div className="flex items-center justify-center py-12 text-sm text-gray-400">
            No operations yet. Click ADD to create one.
          </div>
        )}
      </div>
    </div>
  )
}
