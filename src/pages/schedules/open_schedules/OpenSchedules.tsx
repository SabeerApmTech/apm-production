import { useState, useCallback, useMemo } from "react"
import type { ColDef, ValueGetterParams } from "ag-grid-community"
import { ArrowUpDown, Pencil, Trash2, PackageCheck } from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DataTable } from "@/shared/DataTable"
import { OpenScheduleFormDrawer } from "./OpenScheduleFormDrawer"
import { OpenScheduleOperationsDialog } from "./OpenScheduleOperationsDialog"
import { DeleteDialog } from "@/shared/DeleteDialog"
import { ConfirmPriorityDialog } from "@/shared/ConfirmPriorityDialog"
import { PriorityBadge } from "@/shared/renderers/PriorityBadge"
import { TargetDateCell } from "@/shared/renderers/TargetDateCell"
import { ActionButtonCell } from "@/shared/renderers/ActionButtonCell"
import { getAuthUser } from "@/utils/auth"
import { useSyncedState } from "@/hooks/useSyncedState"
import { useGetCompaniesQuery } from "@/store/services/companyApi"
import { useGetMasterProductsQuery } from "@/store/services/productHierarchyApi"
import type { OpenScheduleRecord } from "@/types/openSchedule"
import {
  useGetOpenSchedulesQuery,
  useCreateOpenScheduleMutation,
  useUpdateOpenScheduleMutation,
  useDeleteOpenScheduleMutation,
  useUpdateOpenSchedulePriorityMutation,
  useCloseOpenScheduleMutation,
} from "@/store/services/openScheduleApi"
import type { OpenScheduleFormValues } from "./OpenScheduleFormDrawer"

// Must be a stable reference, not an inline `?? []` — useSyncedState resets whenever its source
// argument changes identity, and a fresh `[]` literal computed every render (while `data` is
// still undefined) would look like a new source on every render, looping forever.
const EMPTY_SCHEDULES: OpenScheduleRecord[] = []

/* ── Close Schedule dialog ── */
function CloseScheduleDialog({ schedule, onClose }: { schedule: OpenScheduleRecord | null; onClose: () => void }) {
  const [closeSchedule, { isLoading }] = useCloseOpenScheduleMutation()
  const [closeQty, setCloseQty] = useState("")

  const [prevScheduleId, setPrevScheduleId] = useState(schedule?.openScheduleId)
  if (schedule?.openScheduleId !== prevScheduleId) {
    setPrevScheduleId(schedule?.openScheduleId)
    setCloseQty(schedule ? String(schedule.plannedQty) : "")
  }

  async function handleConfirm() {
    const user = getAuthUser()
    if (!schedule || !user || !closeQty) return
    try {
      await closeSchedule({ openScheduleId: schedule.openScheduleId, closeQty: Number(closeQty), updatedByEmpId: user.employeeId }).unwrap()
      onClose()
    } catch {
      // Toast middleware already surfaced the error; keep the dialog open so the user can retry.
    }
  }

  return (
    <Dialog open={!!schedule} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Close Schedule</DialogTitle></DialogHeader>
        <p className="text-sm text-gray-600">
          Closing <span className="font-semibold">{schedule?.scheduleId}</span> marks it complete. Confirm the final quantity produced.
        </p>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="closeQty">Close Qty</Label>
          <Input id="closeQty" type="number" min={0} value={closeQty} onChange={(e) => setCloseQty(e.target.value)} autoFocus />
        </div>
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={isLoading || !closeQty} className="bg-blue-500 hover:bg-blue-600 text-white">
            {isLoading ? "Closing..." : "Close Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ── Actions cell — edit / delete / close, only for roles allowed to manage schedules ── */
function ScheduleActionsCell({ data, onEdit, onDelete, onCloseSchedule }: {
  data?: OpenScheduleRecord
  onEdit: (row: OpenScheduleRecord) => void
  onDelete: (row: OpenScheduleRecord) => void
  onCloseSchedule: (row: OpenScheduleRecord) => void
}) {
  if (!data) return null
  return (
    <div className="flex h-full items-center gap-0.5">
      <button
        onClick={(e) => { e.stopPropagation(); onCloseSchedule(data) }}
        title="Close schedule"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
      >
        <PackageCheck className="h-4 w-4" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(data) }}
        title="Edit schedule"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(data) }}
        title="Delete schedule"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────── */
export function OpenSchedules() {
  const { data, isLoading, isFetching, refetch: refetchSchedules } = useGetOpenSchedulesQuery()
  const schedules = data ?? EMPTY_SCHEDULES
  const { data: companies } = useGetCompaniesQuery()
  const { data: products } = useGetMasterProductsQuery()

  const [createOpenSchedule] = useCreateOpenScheduleMutation()
  const [updateOpenSchedule] = useUpdateOpenScheduleMutation()
  const [deleteOpenSchedule] = useDeleteOpenScheduleMutation()
  const [updateOpenSchedulePriority] = useUpdateOpenSchedulePriorityMutation()

  // Drag-to-reorder is staged locally until confirmed, then persisted via update-priority and
  // resynced from the refetched list — this mirrors the fetched list until a drag is in progress.
  const [localSchedules, setLocalSchedules] = useSyncedState(schedules)

  const [newOrder, setNewOrder]             = useState<OpenScheduleRecord[] | null>(null)
  const [isDirty, setIsDirty]               = useState(false)
  const [confirmPriorityOpen, setConfirmPriorityOpen] = useState(false)
  const [drawerOpen, setDrawerOpen]         = useState(false)
  const [editId, setEditId]                 = useState<number | null>(null)
  const [deleteId, setDeleteId]             = useState<number | null>(null)
  const [operationsId, setOperationsId]     = useState<number | null>(null)
  const [closingSchedule, setClosingSchedule] = useState<OpenScheduleRecord | null>(null)

  const editSchedule = localSchedules.find((s) => s.openScheduleId === editId)

  /* ── Drag ── */
  const handleRowDragEnd = useCallback((reordered: OpenScheduleRecord[]) => {
    const changed = reordered.some((s, i) => s.openScheduleId !== localSchedules[i]?.openScheduleId)
    if (changed) {
      setNewOrder(reordered)
      setIsDirty(true)
    }
  }, [localSchedules])

  const handleConfirmPriority = useCallback(async () => {
    const user = getAuthUser()
    if (newOrder && user) {
      try {
        await updateOpenSchedulePriority({
          updatedByEmpId: user.employeeId,
          schedules: newOrder.map((s, i) => ({ openScheduleId: s.openScheduleId, priorityNo: i + 1 })),
        }).unwrap()
        setLocalSchedules(newOrder.map((s, i) => ({ ...s, priorityNo: i + 1 })))
        setNewOrder(null)
        setIsDirty(false)
      } catch {
        // Toast middleware already surfaced the error; keep the pending order so the user can retry.
      }
    }
    setConfirmPriorityOpen(false)
  }, [newOrder, updateOpenSchedulePriority, setLocalSchedules])

  /* ── CRUD ── */
  const handleAdd = useCallback(async (values: OpenScheduleFormValues) => {
    const user = getAuthUser()
    const product = products?.find((p) => p.itemCode === values.itemCode)
    if (!user || !product) return
    const companyLocation = companies?.find((c) => c.companyName === product.companyName)?.location ?? ""
    await createOpenSchedule({
      scheduleDate: values.scheduleDate,
      priorityLevel: values.priorityLevel,
      itemCode: values.itemCode,
      companyName: product.companyName,
      companyLocation,
      state: values.state,
      productName: product.productionItemName,
      plannedQty: values.plannedQty,
      targetDate: values.targetDate,
      createdByEmpId: user.employeeId,
    }).unwrap()
  }, [products, companies, createOpenSchedule])

  const handleEdit = useCallback(async (values: OpenScheduleFormValues) => {
    const user = getAuthUser()
    if (!editSchedule || !user) return
    await updateOpenSchedule({
      scheduleId: editSchedule.scheduleId,
      scheduleDate: values.scheduleDate,
      itemCode: values.itemCode,
      state: values.state,
      plannedQty: values.plannedQty,
      targetDate: values.targetDate,
      priorityLevel: values.priorityLevel,
      updatedByEmpId: user.employeeId,
    }).unwrap()
  }, [editSchedule, updateOpenSchedule])

  const closeDelete = useCallback(() => setDeleteId(null), [])

  const handleDelete = useCallback(async () => {
    if (deleteId === null) return
    try {
      await deleteOpenSchedule(deleteId).unwrap()
    } catch {
      // Toast middleware already surfaced the error; the list reflects the server's actual state on refetch.
    }
  }, [deleteId, deleteOpenSchedule])

  /* ── Columns ── */
  const openEdit    = useCallback((row: OpenScheduleRecord) => { setEditId(row.openScheduleId); setDrawerOpen(true) }, [])
  const openDelete  = useCallback((row: OpenScheduleRecord) => setDeleteId(row.openScheduleId), [])
  const openOps     = useCallback((id: number) => setOperationsId(id), [])

  // Managers and Supervisors can add/edit/delete/close schedules — Super Admin is read-only here.
  const employeeRole = getAuthUser()?.employeeRole
  const canManageSchedule = employeeRole === "MANAGER" || employeeRole === "SUPERVISOR"

  const columnDefs = useMemo<ColDef<OpenScheduleRecord>[]>(
    () => [
      { field: "priorityNo",     headerName: "Priority No",      maxWidth: 100, sortable: false },
      { field: "priorityLevel",  headerName: "Priority Level",   cellRenderer: PriorityBadge, sortable: false, minWidth: 120 },
      { field: "scheduleDate",   headerName: "Schedule Date",    minWidth: 120 },
      { field: "scheduleId",     headerName: "Schedule ID",      minWidth: 100 },
      { field: "itemCode",       headerName: "Item Code",        minWidth: 110 },
      {
        headerName: "Company",
        valueGetter: (p: ValueGetterParams<OpenScheduleRecord>) =>
          p.data ? `${p.data.companyName} - ${p.data.companyLocation}` : "",
        cellStyle: { fontWeight: 600 },
        minWidth: 160,
      },
      { field: "state",          headerName: "State",            minWidth: 140 },
      { field: "productName",    headerName: "Product",          cellStyle: { fontWeight: 600 }, minWidth: 110 },
      { field: "noOfOperations", headerName: "No of Operations", minWidth: 130 },
      { field: "plannedQty",     headerName: "Planned Qty",      minWidth: 100 },
      { field: "closeQty",       headerName: "Close Qty",        minWidth: 100, valueFormatter: (p) => p.value || "-" },
      { field: "targetDate",     headerName: "Target Date",      cellRenderer: TargetDateCell, minWidth: 110 },
      {
        headerName: "Handover",
        valueGetter: (p: ValueGetterParams<OpenScheduleRecord>) => (p.data?.isHandoverCompleted ? "Completed" : "Pending"),
        cellStyle: (p) => ({ fontWeight: 600, color: p.data?.isHandoverCompleted ? "#16a34a" : "#d97706" }),
        minWidth: 110,
      },
      {
        headerName: "Created By",
        valueGetter: (p: ValueGetterParams<OpenScheduleRecord>) =>
          p.data ? `${p.data.createdByEmpId} : ${p.data.createdByEmpName}` : "",
        minWidth: 150,
      },
      {
        headerName: "Operations",
        cellRenderer: ActionButtonCell,
        cellRendererParams: { onAction: (data: OpenScheduleRecord) => openOps(data.openScheduleId), label: "Operations" },
        sortable: false, minWidth: 110,
      },
      ...(canManageSchedule
        ? [
            {
              headerName: "Actions",
              cellRenderer: ScheduleActionsCell,
              cellRendererParams: { onEdit: openEdit, onDelete: openDelete, onCloseSchedule: (row: OpenScheduleRecord) => setClosingSchedule(row) },
              sortable: false,
              maxWidth: 120,
            } satisfies ColDef<OpenScheduleRecord>,
          ]
        : []),
    ],
    [openEdit, openDelete, openOps, canManageSchedule]
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
      <DataTable<OpenScheduleRecord>
        title="Open Schedules"
        addLabel="Add New Schedule"
        rowData={localSchedules}
        columnDefs={columnDefs}
        loading={isLoading}
        onRefresh={refetchSchedules}
        refreshing={isFetching}
        rowDrag
        hideSno
        onAdd={canManageSchedule ? () => { setEditId(null); setDrawerOpen(true) } : undefined}
        onRowDragEnd={handleRowDragEnd}
        toolbarExtra={updatePriorityButton}
      />

      <ConfirmPriorityDialog
        open={confirmPriorityOpen}
        onClose={() => setConfirmPriorityOpen(false)}
        onConfirm={handleConfirmPriority}
      />

      <OpenScheduleFormDrawer
        key={editId ?? "new"}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditId(null) }}
        schedule={editSchedule}
        onSubmit={editId !== null ? handleEdit : handleAdd}
      />

      <DeleteDialog
        open={deleteId !== null}
        onClose={closeDelete}
        onConfirm={handleDelete}
        title="Delete Schedule"
        description="Are you sure you want to delete this schedule? This action cannot be undone."
      />

      <OpenScheduleOperationsDialog
        key={operationsId ?? "none"}
        open={operationsId !== null}
        onClose={() => setOperationsId(null)}
        openScheduleId={operationsId}
      />

      <CloseScheduleDialog schedule={closingSchedule} onClose={() => setClosingSchedule(null)} />
    </>
  )
}
