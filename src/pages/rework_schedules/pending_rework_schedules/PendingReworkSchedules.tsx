import { useState, useCallback, useMemo } from "react"
import type { ColDef, ICellRendererParams } from "ag-grid-community"
import { Trash2, Pencil, ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { DataTable } from "@/shared/DataTable"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DeleteDialog } from "@/shared/DeleteDialog"
import { AllocationDialog } from "@/pages/schedules/pending_schedules/AllocationDialog"
import { ReworkScheduleFormDrawer } from "./ReworkScheduleFormDrawer"
import type { ReworkScheduleFormValues } from "./ReworkScheduleFormDrawer"

/* ── Types ─────────────────────────────────────────────── */
export interface ReworkScheduleRow {
  id: number
  priorityNo: number
  priorityLevel: "High" | "Medium" | "Low"
  reworkScheduleDate: string
  reworkScheduleId: string
  company: string
  product: string
  noOfOperations: number
  targetQty: number
  producedQty: number
  pendingQty: number
  targetDate: string
  createdBy: string
}

/* ── Mock data ──────────────────────────────────────────── */
const initialSchedules: ReworkScheduleRow[] = [
  {
    id: 1, priorityNo: 1, priorityLevel: "High",
    reworkScheduleDate: "26/05/2026", reworkScheduleId: "RS001-26",
    company: "Lakshika", product: "AIS 140",
    noOfOperations: 19, targetQty: 3000, producedQty: 1000, pendingQty: 2000,
    targetDate: "31/5/2026", createdBy: "2547 : Basheer",
  },
  {
    id: 2, priorityNo: 2, priorityLevel: "Medium",
    reworkScheduleDate: "26/05/2026", reworkScheduleId: "RS002-26",
    company: "Kingstrack", product: "Dashcam",
    noOfOperations: 8, targetQty: 2000, producedQty: 500, pendingQty: 1500,
    targetDate: "20/5/2026", createdBy: "2547 : Basheer",
  },
  {
    id: 3, priorityNo: 3, priorityLevel: "Low",
    reworkScheduleDate: "26/05/2026", reworkScheduleId: "RS003-26",
    company: "Kingstrack", product: "CC TV",
    noOfOperations: 12, targetQty: 3000, producedQty: 1200, pendingQty: 1800,
    targetDate: "10/6/2026", createdBy: "2547 : Basheer",
  },
]

/* ── Helpers ────────────────────────────────────────────── */
function isDatePast(dateStr: string): boolean {
  if (!dateStr) return false
  const parts = dateStr.split("/")
  if (parts.length !== 3) return false
  const [d, m, y] = parts
  return new Date(Number(y), Number(m) - 1, Number(d)) < new Date()
}

function fromIsoDate(isoStr: string): string {
  const parts = isoStr.split("-")
  if (parts.length !== 3) return isoStr
  const [y, m, d] = parts
  return `${d}/${m}/${y}`
}

/* ── Cell renderers ─────────────────────────────────────── */
const PRIORITY_STYLES: Record<string, string> = {
  High:   "bg-red-500 text-white",
  Medium: "bg-yellow-400 text-white",
  Low:    "bg-green-500 text-white",
}

function PriorityLevelBadge({ value }: ICellRendererParams<ReworkScheduleRow>) {
  if (!value) return null
  return (
    <div className="flex h-full items-center">
      <span className={cn("inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold", PRIORITY_STYLES[value] ?? "bg-gray-100 text-gray-700")}>
        {value}
      </span>
    </div>
  )
}

function TargetDateCell({ value }: ICellRendererParams<ReworkScheduleRow>) {
  const past = isDatePast(String(value ?? ""))
  return (
    <span className={cn("text-sm font-medium", past ? "text-red-500" : "text-gray-700")}>
      {value}
    </span>
  )
}

interface AllocateCellParams extends ICellRendererParams<ReworkScheduleRow> {
  onAllocate?: (id: number) => void
}

function AllocateCell({ data, onAllocate }: AllocateCellParams) {
  return (
    <div className="flex h-full items-center">
      <button
        onClick={(e) => { e.stopPropagation(); if (data) onAllocate?.(data.id) }}
        className="rounded-md bg-blue-500 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-600 transition-colors"
      >
        Allocate
      </button>
    </div>
  )
}

interface ActionCellParams extends ICellRendererParams<ReworkScheduleRow> {
  onEdit?:   (id: number) => void
  onDelete?: (id: number) => void
}

function ActionsCell({ data, onEdit, onDelete }: ActionCellParams) {
  return (
    <div className="flex h-full items-center gap-0.5">
      <button
        onClick={(e) => { e.stopPropagation(); if (data) onDelete?.(data.id) }}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); if (data) onEdit?.(data.id) }}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────── */
export function PendingReworkSchedules() {
  const [schedules, setSchedules]       = useState<ReworkScheduleRow[]>(initialSchedules)
  const [newOrder,  setNewOrder]        = useState<ReworkScheduleRow[] | null>(null)
  const [isDirty,   setIsDirty]         = useState(false)
  const [confirmPriorityOpen, setConfirmPriorityOpen] = useState(false)
  const [drawerOpen, setDrawerOpen]     = useState(false)
  const [editId,    setEditId]          = useState<number | null>(null)
  const [deleteId,  setDeleteId]        = useState<number | null>(null)
  const [allocationId, setAllocationId] = useState<number | null>(null)

  const editSchedule = schedules.find((s) => s.id === editId)

  const handleRowDragEnd = useCallback((reordered: ReworkScheduleRow[]) => {
    const changed = reordered.some((s, i) => s.id !== schedules[i]?.id)
    if (changed) { setNewOrder(reordered); setIsDirty(true) }
  }, [schedules])

  const handleConfirmPriority = useCallback(() => {
    if (newOrder) {
      setSchedules(newOrder.map((s, i) => ({ ...s, priorityNo: i + 1 })))
      setNewOrder(null)
      setIsDirty(false)
    }
    setConfirmPriorityOpen(false)
  }, [newOrder])

  const handleAdd = useCallback((data: ReworkScheduleFormValues) => {
    const next = Math.max(0, ...schedules.map((s) => s.id)) + 1
    setSchedules((prev) => [
      ...prev,
      {
        id: next,
        priorityNo: prev.length + 1,
        priorityLevel: data.priorityLevel,
        reworkScheduleDate: fromIsoDate(data.reworkScheduleDate),
        reworkScheduleId: `RS${String(next).padStart(3, "0")}-26`,
        company: data.company,
        product: data.product,
        noOfOperations: data.noOfOperations,
        targetQty: data.targetQty,
        producedQty: 0,
        pendingQty: data.targetQty,
        targetDate: fromIsoDate(data.targetDate),
        createdBy: "2547 : Basheer",
      },
    ])
  }, [schedules])

  const handleEdit = useCallback((data: ReworkScheduleFormValues) => {
    if (editId === null) return
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === editId
          ? {
              ...s,
              priorityLevel: data.priorityLevel,
              reworkScheduleDate: fromIsoDate(data.reworkScheduleDate),
              company: data.company,
              product: data.product,
              noOfOperations: data.noOfOperations,
              targetQty: data.targetQty,
              targetDate: fromIsoDate(data.targetDate),
            }
          : s
      )
    )
  }, [editId])

  const handleDelete = useCallback(() => {
    if (deleteId === null) return
    setSchedules((prev) => prev.filter((s) => s.id !== deleteId))
    setDeleteId(null)
  }, [deleteId])

  const openEdit   = useCallback((id: number) => { setEditId(id); setDrawerOpen(true) }, [])
  const openDelete = useCallback((id: number) => setDeleteId(id), [])
  const openAlloc  = useCallback((id: number) => setAllocationId(id), [])

  const columnDefs = useMemo<ColDef<ReworkScheduleRow>[]>(
    () => [
      { field: "priorityNo",          headerName: "Priority No",          maxWidth: 100, sortable: false },
      { field: "priorityLevel",       headerName: "Priority Level",       cellRenderer: PriorityLevelBadge, sortable: false, minWidth: 120 },
      { field: "reworkScheduleDate",  headerName: "Rework Schedule Date", minWidth: 160 },
      { field: "reworkScheduleId",    headerName: "Rework Schedule ID",   minWidth: 150 },
      { field: "company",             headerName: "Company",              cellStyle: { fontWeight: 600 }, minWidth: 110 },
      { field: "product",             headerName: "Product",              cellStyle: { fontWeight: 600 }, minWidth: 100 },
      { field: "noOfOperations",      headerName: "No of Operations",     minWidth: 140 },
      { field: "targetQty",           headerName: "Target Qty",           minWidth: 100 },
      { field: "producedQty",         headerName: "Produced Qty",         minWidth: 120 },
      { field: "pendingQty",          headerName: "Pending Qty",          minWidth: 110 },
      { field: "targetDate",          headerName: "Target Date",          cellRenderer: TargetDateCell, minWidth: 110 },
      { field: "createdBy",           headerName: "Created By",           minWidth: 130 },
      {
        headerName: "Staff Allocation",
        cellRenderer: AllocateCell,
        cellRendererParams: { onAllocate: openAlloc },
        sortable: false, minWidth: 130,
      },
      {
        headerName: "Actions",
        cellRenderer: ActionsCell,
        cellRendererParams: { onEdit: openEdit, onDelete: openDelete },
        sortable: false, maxWidth: 90,
      },
    ],
    [openEdit, openDelete, openAlloc]
  )

  const updatePriorityButton = isDirty ? (
    <button
      onClick={() => setConfirmPriorityOpen(true)}
      className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 active:bg-orange-700"
    >
      <ArrowUpDown className="h-4 w-4" />
      Update Priority
    </button>
  ) : undefined

  return (
    <>
      <DataTable<ReworkScheduleRow>
        title="Rework Schedule"
        rowData={schedules}
        columnDefs={columnDefs}
        rowDrag
        hideSno
        onAdd={() => { setEditId(null); setDrawerOpen(true) }}
        onRowDragEnd={handleRowDragEnd}
        toolbarExtra={updatePriorityButton}
      />

      <Dialog open={confirmPriorityOpen} onOpenChange={(o) => { if (!o) setConfirmPriorityOpen(false) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Priority Order</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 mt-1">
            Are you sure you want to save the new priority order? This will reassign priority numbers to all rework schedules.
          </p>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setConfirmPriorityOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmPriority} className="bg-blue-500 hover:bg-blue-600 text-white">
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReworkScheduleFormDrawer
        key={editId ?? "new"}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditId(null) }}
        schedule={editSchedule}
        onSubmit={editId !== null ? handleEdit : handleAdd}
      />

      <DeleteDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Rework Schedule"
        description="Are you sure you want to delete this rework schedule? This action cannot be undone."
      />

      <AllocationDialog
        open={allocationId !== null}
        onClose={() => setAllocationId(null)}
        scheduleId={allocationId}
      />
    </>
  )
}
