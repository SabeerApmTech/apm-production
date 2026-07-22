import { useState, useCallback, useMemo } from "react"
import type { ColDef, ValueGetterParams } from "ag-grid-community"
import { ArrowUpDown } from "lucide-react"
import { DataTable } from "@/shared/DataTable"
import { ScheduleFormDrawer } from "./ScheduleFormDrawer"
import { DeleteDialog } from "@/shared/DeleteDialog"
import { ConfirmPriorityDialog } from "@/shared/ConfirmPriorityDialog"
import { AllocationDialog } from "./AllocationDialog"
import { PriorityBadge } from "@/shared/renderers/PriorityBadge"
import { TargetDateCell } from "@/shared/renderers/TargetDateCell"
import { EditDeleteCell } from "@/shared/renderers/EditDeleteCell"
import { ActionButtonCell } from "@/shared/renderers/ActionButtonCell"
import { getAuthUser } from "@/utils/auth"
import { useSyncedState } from "@/hooks/useSyncedState"
import { STAFF_ALLOCATION_BUTTON_STYLES, type StaffAllocationStatus } from "@/shared/constants"
import { useGetCompaniesQuery } from "@/store/services/companyApi"
import type { PendingScheduleRecord } from "@/types/pendingSchedule"
import {
  useGetPendingSchedulesQuery,
  useCreatePendingScheduleMutation,
  useUpdatePendingScheduleMutation,
  useDeletePendingScheduleMutation,
  useUpdatePendingSchedulePriorityMutation,
} from "@/store/services/pendingScheduleApi"
import type { ScheduleFormValues } from "./ScheduleFormDrawer"

// Must be a stable reference, not an inline `?? []` — useSyncedState resets whenever its source
// argument changes identity, and a fresh `[]` literal computed every render (while `data` is
// still undefined) would look like a new source on every render, looping forever.
const EMPTY_SCHEDULES: PendingScheduleRecord[] = []

/* ── Page ───────────────────────────────────────────────── */
export function PendingSchedules() {
  const { data, isLoading, isFetching, refetch: refetchSchedules } = useGetPendingSchedulesQuery()
  const schedules = data ?? EMPTY_SCHEDULES
  const { data: companies } = useGetCompaniesQuery()

  const [createPendingSchedule] = useCreatePendingScheduleMutation()
  const [updatePendingSchedule] = useUpdatePendingScheduleMutation()
  const [deletePendingSchedule] = useDeletePendingScheduleMutation()
  const [updatePendingSchedulePriority] = useUpdatePendingSchedulePriorityMutation()

  // Drag-to-reorder is staged locally until confirmed, then persisted via update-priority and
  // resynced from the refetched list — this mirrors the fetched list until a drag is in progress.
  const [localSchedules, setLocalSchedules] = useSyncedState(schedules)

  const [newOrder, setNewOrder]             = useState<PendingScheduleRecord[] | null>(null)
  const [isDirty, setIsDirty]               = useState(false)
  const [confirmPriorityOpen, setConfirmPriorityOpen] = useState(false)
  const [drawerOpen, setDrawerOpen]         = useState(false)
  const [editId, setEditId]                 = useState<number | null>(null)
  const [deleteId, setDeleteId]             = useState<number | null>(null)
  const [allocationId, setAllocationId]     = useState<number | null>(null)

  const editSchedule = localSchedules.find((s) => s.pendingScheduleId === editId)

  /* ── Drag ── */
  const handleRowDragEnd = useCallback((reordered: PendingScheduleRecord[]) => {
    const changed = reordered.some((s, i) => s.pendingScheduleId !== localSchedules[i]?.pendingScheduleId)
    if (changed) {
      setNewOrder(reordered)
      setIsDirty(true)
    }
  }, [localSchedules])

  const handleConfirmPriority = useCallback(async () => {
    if (newOrder) {
      try {
        await updatePendingSchedulePriority(
          newOrder.map((s, i) => ({ pendingScheduleId: s.pendingScheduleId, priorityNo: i + 1 }))
        ).unwrap()
        setLocalSchedules(newOrder.map((s, i) => ({ ...s, priorityNo: i + 1 })))
        setNewOrder(null)
        setIsDirty(false)
      } catch {
        // Toast middleware already surfaced the error; keep the pending order so the user can retry.
      }
    }
    setConfirmPriorityOpen(false)
  }, [newOrder, updatePendingSchedulePriority, setLocalSchedules])

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
    const user = getAuthUser()
    if (!user) return
    try {
      await deletePendingSchedule({ pendingScheduleId: deleteId, deletedByEmpId: user.employeeId }).unwrap()
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
        onClose={() => { setAllocationId(null); refetchSchedules() }}
        scheduleId={allocationId}
      />
    </>
  )
}
