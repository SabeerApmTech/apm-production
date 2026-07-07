import { useState, useCallback, useMemo } from "react"
import type { ColDef, ValueGetterParams } from "ag-grid-community"
import { ArrowUpDown } from "lucide-react"
import { DataTable } from "@/shared/DataTable"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScheduleFormDrawer } from "./ScheduleFormDrawer"
import { DeleteDialog } from "@/shared/DeleteDialog"
import { AllocationDialog } from "./AllocationDialog"
import { PriorityBadge } from "@/shared/renderers/PriorityBadge"
import { TargetDateCell } from "@/shared/renderers/TargetDateCell"
import { EditDeleteCell } from "@/shared/renderers/EditDeleteCell"
import { ActionButtonCell } from "@/shared/renderers/ActionButtonCell"
import { getAuthUser } from "@/utils/auth"
import { STAFF_ALLOCATION_BUTTON_STYLES, type StaffAllocationStatus } from "@/shared/constants"
import { useGetCompaniesQuery } from "@/store/services/companyApi"
import type { PendingScheduleRecord } from "@/types/pendingSchedule"
import {
  useGetPendingSchedulesQuery,
  useCreatePendingScheduleMutation,
  useUpdatePendingScheduleMutation,
  useDeletePendingScheduleMutation,
} from "@/store/services/pendingScheduleApi"
import type { ScheduleFormValues } from "./ScheduleFormDrawer"

/* ── Page ───────────────────────────────────────────────── */
export function PendingSchedules() {
  const { data, isLoading } = useGetPendingSchedulesQuery()
  const schedules = useMemo(() => data ?? [], [data])
  const { data: companies } = useGetCompaniesQuery()

  const [createPendingSchedule] = useCreatePendingScheduleMutation()
  const [updatePendingSchedule] = useUpdatePendingScheduleMutation()
  const [deletePendingSchedule] = useDeletePendingScheduleMutation()

  // No reorder endpoint exists yet, so drag-to-reorder is local-only/visual — it mirrors the
  // fetched list but diverges after a confirmed reorder, and resets whenever the underlying
  // query result changes (create/edit/delete refetch, or a manual page refresh).
  const [prevSchedules, setPrevSchedules] = useState(schedules)
  const [localSchedules, setLocalSchedules] = useState<PendingScheduleRecord[]>(schedules)
  if (schedules !== prevSchedules) {
    setPrevSchedules(schedules)
    setLocalSchedules(schedules)
  }

  const [newOrder, setNewOrder]             = useState<PendingScheduleRecord[] | null>(null)
  const [isDirty, setIsDirty]               = useState(false)
  const [confirmPriorityOpen, setConfirmPriorityOpen] = useState(false)
  const [drawerOpen, setDrawerOpen]         = useState(false)
  const [editId, setEditId]                 = useState<number | null>(null)
  const [deleteId, setDeleteId]             = useState<number | null>(null)
  const [allocationId, setAllocationId]     = useState<number | null>(null)

  const editSchedule = localSchedules.find((s) => s.pendingScheduleId === editId)

  /* ── Drag (local-only) ── */
  const handleRowDragEnd = useCallback((reordered: PendingScheduleRecord[]) => {
    const changed = reordered.some((s, i) => s.pendingScheduleId !== localSchedules[i]?.pendingScheduleId)
    if (changed) {
      setNewOrder(reordered)
      setIsDirty(true)
    }
  }, [localSchedules])

  const handleConfirmPriority = useCallback(() => {
    if (newOrder) {
      setLocalSchedules(newOrder.map((s, i) => ({ ...s, priorityNo: i + 1 })))
      setNewOrder(null)
      setIsDirty(false)
    }
    setConfirmPriorityOpen(false)
  }, [newOrder])

  /* ── CRUD ── */
  const handleAdd = useCallback(async (values: ScheduleFormValues) => {
    const user = getAuthUser()
    if (!user) return
    const companyLocation = companies?.find((c) => c.companyName === values.companyName)?.companyLocation ?? ""
    await createPendingSchedule({
      scheduleDate: values.scheduleDate,
      companyName: values.companyName,
      companyLocation,
      productName: values.productName,
      targetQty: values.targetQty,
      targetDate: values.targetDate,
      priorityLevel: values.priorityLevel,
      createdByEmpId: user.employeeId,
    }).unwrap()
  }, [companies, createPendingSchedule])

  const handleEdit = useCallback(async (values: ScheduleFormValues) => {
    if (!editSchedule) return
    await updatePendingSchedule({
      scheduleId: editSchedule.scheduleId,
      scheduleDate: values.scheduleDate,
      targetQty: values.targetQty,
      targetDate: values.targetDate,
      priorityLevel: values.priorityLevel,
    }).unwrap()
  }, [editSchedule, updatePendingSchedule])

  const closeDelete = useCallback(() => setDeleteId(null), [])

  const handleDelete = useCallback(async () => {
    if (deleteId === null) return
    try {
      await deletePendingSchedule(deleteId).unwrap()
    } catch {
      // Toast middleware already surfaced the error; the list reflects the server's actual state on refetch.
    }
  }, [deleteId, deletePendingSchedule])

  /* ── Columns ── */
  const openEdit   = useCallback((id: number) => { setEditId(id);   setDrawerOpen(true) }, [])
  const openDelete = useCallback((id: number) => setDeleteId(id), [])
  const openAlloc  = useCallback((id: number) => setAllocationId(id), [])

  // Only Supervisors can allocate staff — Super Admin and Manager see the action disabled.
  const canAllocate = getAuthUser()?.employeeRole === "SUPERVISOR"
  // Only Managers can add/edit/delete schedules — Super Admin and Supervisor are read-only here.
  const canManageSchedule = getAuthUser()?.employeeRole === "MANAGER"

  const columnDefs = useMemo<ColDef<PendingScheduleRecord>[]>(
    () => [
      { field: "priorityNo",     headerName: "Priority No",      maxWidth: 100, sortable: false },
      { field: "priorityLevel",  headerName: "Priority Level",   cellRenderer: PriorityBadge, sortable: false, minWidth: 120 },
      { field: "scheduleDate",   headerName: "Schedule Date",    minWidth: 120 },
      { field: "scheduleId",     headerName: "Schedule ID",      minWidth: 100 },
      { field: "companyName",    headerName: "Company",          cellStyle: { fontWeight: 600 }, minWidth: 110 },
      { field: "productName",    headerName: "Product",          cellStyle: { fontWeight: 600 }, minWidth: 100 },
      { field: "noOfOperations", headerName: "No of Operations", minWidth: 130 },
      { field: "targetQty",      headerName: "Target Qty",       minWidth: 100 },
      { field: "producedQty",    headerName: "Produced Qty",     minWidth: 110 },
      { field: "targetDate",     headerName: "Target Date",      cellRenderer: TargetDateCell, minWidth: 110 },
      {
        headerName: "Created By",
        valueGetter: (p: ValueGetterParams<PendingScheduleRecord>) =>
          p.data ? `${p.data.createdByEmpId} : ${p.data.createdByEmpName}` : "",
        minWidth: 150,
      },
      {
        headerName: "Staff Allocated",
        cellRenderer: ActionButtonCell,
        cellRendererParams: {
          onAction: (data: PendingScheduleRecord) => openAlloc(data.pendingScheduleId),
          label: "Allocate",
          disabled: !canAllocate,
          getButtonClass: (data: PendingScheduleRecord) =>
            STAFF_ALLOCATION_BUTTON_STYLES[data.staffAllocationStatus as StaffAllocationStatus],
        },
        sortable: false, minWidth: 120,
      },
      ...(canManageSchedule
        ? [
            {
              headerName: "Actions",
              cellRenderer: EditDeleteCell,
              cellRendererParams: { onEdit: openEdit, onDelete: openDelete },
              sortable: false,
              maxWidth: 90,
            } satisfies ColDef<PendingScheduleRecord>,
          ]
        : []),
    ],
    [openEdit, openDelete, openAlloc, canAllocate, canManageSchedule]
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
      <DataTable<PendingScheduleRecord>
        title="Schedule"
        rowData={localSchedules}
        columnDefs={columnDefs}
        loading={isLoading}
        rowDrag
        hideSno
        onAdd={canManageSchedule ? () => { setEditId(null); setDrawerOpen(true) } : undefined}
        onRowDragEnd={handleRowDragEnd}
        toolbarExtra={updatePriorityButton}
      />

      <Dialog open={confirmPriorityOpen} onOpenChange={(o) => { if (!o) setConfirmPriorityOpen(false) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Priority Order</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 mt-1">
            Are you sure you want to save the new priority order? This will reassign priority numbers to all schedules.
          </p>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setConfirmPriorityOpen(false)}>Cancel</Button>
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

      <DeleteDialog
        open={deleteId !== null}
        onClose={closeDelete}
        onConfirm={handleDelete}
        title="Delete Schedule"
        description="Are you sure you want to delete this schedule? This action cannot be undone."
      />

      <AllocationDialog
        key={allocationId ?? "none"}
        open={allocationId !== null}
        onClose={() => setAllocationId(null)}
        scheduleId={allocationId}
      />
    </>
  )
}
