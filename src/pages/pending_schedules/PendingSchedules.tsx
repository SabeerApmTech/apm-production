import { useState, useCallback, useMemo } from "react"
import type { ColDef, ICellRendererParams } from "ag-grid-community"
import { Trash2, Pencil, ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { DataTable } from "@/shared/DataTable"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScheduleFormDrawer } from "./ScheduleFormDrawer"
import { DeleteScheduleDialog } from "./DeleteScheduleDialog"
import { AllocationDialog } from "./AllocationDialog"
import type { ScheduleFormValues } from "./ScheduleFormDrawer"

/* ── Types ─────────────────────────────────────────────── */
export interface ScheduleRow {
  id: number
  priorityNo: number
  priorityLevel: "High" | "Medium" | "Low"
  scheduleDate: string
  scheduleId: string
  company: string
  product: string
  noOfOperations: number
  targetQty: number
  producedQty: number
  pendingQty: number
  handoverQty: number
  targetDate: string
  createdBy: string
}

/* ── Mock data ──────────────────────────────────────────── */
const initialSchedules: ScheduleRow[] = [
  {
    id: 1, priorityNo: 1, priorityLevel: "High",
    scheduleDate: "26/05/2026", scheduleId: "S001-26",
    company: "Lakshika", product: "AIS 140",
    noOfOperations: 19, targetQty: 3000, producedQty: 1000,
    pendingQty: 2000, handoverQty: 1000,
    targetDate: "31/5/2026", createdBy: "2547 : Basheer",
  },
  {
    id: 2, priorityNo: 2, priorityLevel: "Medium",
    scheduleDate: "26/05/2026", scheduleId: "S002-26",
    company: "Kingstrack", product: "Dashcam",
    noOfOperations: 8, targetQty: 2000, producedQty: 0,
    pendingQty: 2000, handoverQty: 1000,
    targetDate: "20/5/2026", createdBy: "2547 : Basheer",
  },
  {
    id: 3, priorityNo: 3, priorityLevel: "Low",
    scheduleDate: "26/05/2026", scheduleId: "S003-26",
    company: "Kingstrack", product: "CC TV",
    noOfOperations: 12, targetQty: 3000, producedQty: 1200,
    pendingQty: 1800, handoverQty: 1000,
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

function PriorityLevelBadge({ value }: ICellRendererParams<ScheduleRow>) {
  if (!value) return null
  return (
    <div className="flex h-full items-center">
      <span className={cn("inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold", PRIORITY_STYLES[value] ?? "bg-gray-100 text-gray-700")}>
        {value}
      </span>
    </div>
  )
}

function TargetDateCell({ value }: ICellRendererParams<ScheduleRow>) {
  const past = isDatePast(String(value ?? ""))
  return (
    <span className={cn("text-sm font-medium", past ? "text-red-500" : "text-gray-700")}>
      {value}
    </span>
  )
}

interface AllocateCellParams extends ICellRendererParams<ScheduleRow> {
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

interface ScheduleActionCellParams extends ICellRendererParams<ScheduleRow> {
  onEdit?:   (id: number) => void
  onDelete?: (id: number) => void
}

function ScheduleActionsCell({ data, onEdit, onDelete }: ScheduleActionCellParams) {
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
export function PendingSchedules() {
  const [schedules, setSchedules]           = useState<ScheduleRow[]>(initialSchedules)
  const [newOrder, setNewOrder]             = useState<ScheduleRow[] | null>(null)
  const [isDirty, setIsDirty]               = useState(false)
  const [confirmPriorityOpen, setConfirmPriorityOpen] = useState(false)
  const [drawerOpen, setDrawerOpen]         = useState(false)
  const [editId, setEditId]                 = useState<number | null>(null)
  const [deleteId, setDeleteId]             = useState<number | null>(null)
  const [allocationId, setAllocationId]     = useState<number | null>(null)

  const editSchedule = schedules.find((s) => s.id === editId)

  /* ── Drag ── */
  const handleRowDragEnd = useCallback((reordered: ScheduleRow[]) => {
    const changed = reordered.some((s, i) => s.id !== schedules[i]?.id)
    if (changed) {
      setNewOrder(reordered)
      setIsDirty(true)
    }
  }, [schedules])

  const handleConfirmPriority = useCallback(() => {
    if (newOrder) {
      setSchedules(newOrder.map((s, i) => ({ ...s, priorityNo: i + 1 })))
      setNewOrder(null)
      setIsDirty(false)
    }
    setConfirmPriorityOpen(false)
  }, [newOrder])

  const cancelPriorityUpdate = useCallback(() => {
    setConfirmPriorityOpen(false)
  }, [])

  /* ── CRUD ── */
  const handleAdd = useCallback((data: ScheduleFormValues) => {
    const next = Math.max(0, ...schedules.map((s) => s.id)) + 1
    setSchedules((prev) => [
      ...prev,
      {
        id: next,
        priorityNo: prev.length + 1,
        priorityLevel: data.priorityLevel,
        scheduleDate: fromIsoDate(data.scheduleDate),
        scheduleId: `S${String(next).padStart(3, "0")}-26`,
        company: data.company,
        product: data.product,
        noOfOperations: data.noOfOperations,
        targetQty: data.targetQty,
        producedQty: 0,
        pendingQty: data.targetQty,
        handoverQty: 0,
        targetDate: fromIsoDate(data.targetDate),
        createdBy: "2547 : Basheer",
      },
    ])
  }, [schedules])

  const handleEdit = useCallback((data: ScheduleFormValues) => {
    if (editId === null) return
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === editId
          ? {
              ...s,
              priorityLevel: data.priorityLevel,
              scheduleDate: fromIsoDate(data.scheduleDate),
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

  /* ── Columns ── */
  const openEdit   = useCallback((id: number) => { setEditId(id);   setDrawerOpen(true) }, [])
  const openDelete = useCallback((id: number) => setDeleteId(id), [])
  const openAlloc  = useCallback((id: number) => setAllocationId(id), [])

  const columnDefs = useMemo<ColDef<ScheduleRow>[]>(
    () => [
      { field: "priorityNo",     headerName: "Priority No",      maxWidth: 100, sortable: false },
      { field: "priorityLevel",  headerName: "Priority Level",   cellRenderer: PriorityLevelBadge, sortable: false, minWidth: 120 },
      { field: "scheduleDate",   headerName: "Schedule Date",    minWidth: 120 },
      { field: "scheduleId",     headerName: "Schedule ID",      minWidth: 100 },
      { field: "company",        headerName: "Company",          cellStyle: { fontWeight: 600 }, minWidth: 110 },
      { field: "product",        headerName: "Product",          cellStyle: { fontWeight: 600 }, minWidth: 100 },
      { field: "noOfOperations", headerName: "No of Operations", minWidth: 130 },
      { field: "targetQty",      headerName: "Target Qty",       minWidth: 100 },
      { field: "producedQty",    headerName: "Produced Qty",     minWidth: 110 },
      { field: "pendingQty",     headerName: "Pending Qty",      minWidth: 100 },
      { field: "handoverQty",    headerName: "Handover Qty",     minWidth: 110 },
      { field: "targetDate",     headerName: "Target Date",      cellRenderer: TargetDateCell, minWidth: 110 },
      { field: "createdBy",      headerName: "Created By",       minWidth: 130 },
      {
        headerName: "Staff Allocated",
        cellRenderer: AllocateCell,
        cellRendererParams: { onAllocate: openAlloc },
        sortable: false, minWidth: 120,
      },
      {
        headerName: "Actions",
        cellRenderer: ScheduleActionsCell,
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
      <DataTable<ScheduleRow>
        title="Schedule"
        rowData={schedules}
        columnDefs={columnDefs}
        rowDrag
        hideSno
        onAdd={() => { setEditId(null); setDrawerOpen(true) }}
        onRowDragEnd={handleRowDragEnd}
        toolbarExtra={updatePriorityButton}
      />

      {/* Priority update confirmation */}
      <Dialog open={confirmPriorityOpen} onOpenChange={(o) => { if (!o) setConfirmPriorityOpen(false) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Priority Order</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 mt-1">
            Are you sure you want to save the new priority order? This will reassign priority numbers to all schedules.
          </p>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={cancelPriorityUpdate}>Cancel</Button>
            <Button onClick={handleConfirmPriority} className="bg-blue-500 hover:bg-blue-600 text-white">
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ScheduleFormDrawer
        key={editId ?? "new"}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditId(null) }}
        schedule={editSchedule}
        onSubmit={editId !== null ? handleEdit : handleAdd}
      />

      <DeleteScheduleDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
      />

      <AllocationDialog
        open={allocationId !== null}
        onClose={() => setAllocationId(null)}
        scheduleId={allocationId}
      />
    </>
  )
}
