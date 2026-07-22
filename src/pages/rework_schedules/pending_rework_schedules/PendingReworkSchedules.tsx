import { useState, useCallback, useMemo } from "react"
import type { ColDef, ValueGetterParams } from "ag-grid-community"
import { ArrowUpDown } from "lucide-react"
import { DataTable } from "@/shared/DataTable"
import { ReworkScheduleFormDrawer } from "./ReworkScheduleFormDrawer"
import { DeleteDialog } from "@/shared/DeleteDialog"
import { ConfirmPriorityDialog } from "@/shared/ConfirmPriorityDialog"
import { ReworkAllocationDialog } from "./ReworkAllocationDialog"
import { PriorityBadge } from "@/shared/renderers/PriorityBadge"
import { TargetDateCell } from "@/shared/renderers/TargetDateCell"
import { EditDeleteCell } from "@/shared/renderers/EditDeleteCell"
import { ActionButtonCell } from "@/shared/renderers/ActionButtonCell"
import { getAuthUser } from "@/utils/auth"
import { useSyncedState } from "@/hooks/useSyncedState"
import { STAFF_ALLOCATION_BUTTON_STYLES, type StaffAllocationStatus } from "@/shared/constants"
import { useGetCompaniesQuery } from "@/store/services/companyApi"
import type { ReworkPendingScheduleRecord, ReworkType } from "@/types/reworkSchedule"
import {
  useGetReworkPendingSchedulesQuery,
  useCreateReworkPendingScheduleMutation,
  useUpdateReworkPendingScheduleMutation,
  useDeleteReworkPendingScheduleMutation,
  useUpdateReworkPendingSchedulePriorityMutation,
} from "@/store/services/reworkPendingScheduleApi"
import type { ReworkScheduleFormValues } from "./ReworkScheduleFormDrawer"

// Must be a stable reference, not an inline `?? []` — useSyncedState resets whenever its source
// argument changes identity, and a fresh `[]` literal computed every render (while `data` is
// still undefined) would look like a new source on every render, looping forever.
const EMPTY_SCHEDULES: ReworkPendingScheduleRecord[] = []

const REWORK_TYPE_LABELS: Record<ReworkType, string> = {
  CustomerService: "Customer Service",
  ReworkFromStore: "Rework From Store",
  InhouseRework: "Inhouse Rework",
}

/* ── Page ───────────────────────────────────────────────── */
export function PendingReworkSchedules() {
  const { data, isLoading, isFetching, refetch: refetchSchedules } = useGetReworkPendingSchedulesQuery()
  const schedules = data ?? EMPTY_SCHEDULES
  const { data: companies } = useGetCompaniesQuery()

  const [createReworkPendingSchedule] = useCreateReworkPendingScheduleMutation()
  const [updateReworkPendingSchedule] = useUpdateReworkPendingScheduleMutation()
  const [deleteReworkPendingSchedule] = useDeleteReworkPendingScheduleMutation()
  const [updateReworkPendingSchedulePriority] = useUpdateReworkPendingSchedulePriorityMutation()

  // Drag-to-reorder is staged locally until confirmed, then persisted via update-priority and
  // resynced from the refetched list — this mirrors the fetched list until a drag is in progress.
  const [localSchedules, setLocalSchedules] = useSyncedState(schedules)

  const [newOrder, setNewOrder]             = useState<ReworkPendingScheduleRecord[] | null>(null)
  const [isDirty, setIsDirty]               = useState(false)
  const [confirmPriorityOpen, setConfirmPriorityOpen] = useState(false)
  const [drawerOpen, setDrawerOpen]         = useState(false)
  const [editId, setEditId]                 = useState<number | null>(null)
  const [deleteId, setDeleteId]             = useState<number | null>(null)
  const [allocationId, setAllocationId]     = useState<number | null>(null)

  const editSchedule = localSchedules.find((s) => s.reworkPendingScheduleId === editId)

  /* ── Drag ── */
  const handleRowDragEnd = useCallback((reordered: ReworkPendingScheduleRecord[]) => {
    const changed = reordered.some((s, i) => s.reworkPendingScheduleId !== localSchedules[i]?.reworkPendingScheduleId)
    if (changed) {
      setNewOrder(reordered)
      setIsDirty(true)
    }
  }, [localSchedules])

  const handleConfirmPriority = useCallback(async () => {
    if (newOrder) {
      try {
        await updateReworkPendingSchedulePriority(
          newOrder.map((s, i) => ({ reworkPendingScheduleId: s.reworkPendingScheduleId, priorityNo: i + 1 }))
        ).unwrap()
        setLocalSchedules(newOrder.map((s, i) => ({ ...s, priorityNo: i + 1 })))
        setNewOrder(null)
        setIsDirty(false)
      } catch {
        // Toast middleware already surfaced the error; keep the pending order so the user can retry.
      }
    }
    setConfirmPriorityOpen(false)
  }, [newOrder, updateReworkPendingSchedulePriority, setLocalSchedules])

  /* ── CRUD ── */
  const handleAdd = useCallback(async (values: ReworkScheduleFormValues) => {
    const user = getAuthUser()
    if (!user) return
    const companyLocation = companies?.find((c) => c.companyName === values.companyName)?.companyLocation ?? ""
    await createReworkPendingSchedule({
      reworkScheduleDate: values.reworkScheduleDate,
      reworkType: values.reworkType,
      companyName: values.companyName,
      companyLocation,
      productName: values.productName,
      targetQty: values.targetQty,
      targetDate: values.targetDate,
      priorityLevel: values.priorityLevel,
      createdByEmpId: user.employeeId,
    }).unwrap()
  }, [companies, createReworkPendingSchedule])

  const handleEdit = useCallback(async (values: ReworkScheduleFormValues) => {
    const user = getAuthUser()
    if (!editSchedule || !user) return
    await updateReworkPendingSchedule({
      reworkScheduleId: editSchedule.reworkScheduleId,
      reworkScheduleDate: values.reworkScheduleDate,
      targetQty: values.targetQty,
      targetDate: values.targetDate,
      priorityLevel: values.priorityLevel,
      updatedByEmpId: user.employeeId,
    }).unwrap()
  }, [editSchedule, updateReworkPendingSchedule])

  const closeDelete = useCallback(() => setDeleteId(null), [])

  const handleDelete = useCallback(async () => {
    if (deleteId === null) return
    const user = getAuthUser()
    if (!user) return
    try {
      await deleteReworkPendingSchedule({ reworkPendingScheduleId: deleteId, deletedByEmpId: user.employeeId }).unwrap()
    } catch {
      // Toast middleware already surfaced the error; the list reflects the server's actual state on refetch.
    }
  }, [deleteId, deleteReworkPendingSchedule])

  /* ── Columns ── */
  const openEdit   = useCallback((id: number) => { setEditId(id);   setDrawerOpen(true) }, [])
  const openDelete = useCallback((id: number) => setDeleteId(id), [])
  const openAlloc  = useCallback((id: number) => setAllocationId(id), [])

  // Only Supervisors can allocate staff — Super Admin and Manager see the action disabled.
  const canAllocate = getAuthUser()?.employeeRole === "SUPERVISOR"
  // Managers and Supervisors can add rework schedules and see the Actions column — which of them
  // can actually edit/delete a given row is further narrowed per-row below; Super Admin is read-only.
  const employeeRole = getAuthUser()?.employeeRole
  const canManageSchedule = employeeRole === "MANAGER" || employeeRole === "SUPERVISOR"
  // Each role only manages the rework types it's allowed to raise: Supervisors can edit/delete only
  // Inhouse Rework rows, Managers only Customer Service / Rework From Store rows — neither role can
  // touch the other's rows, enforced per-row below rather than by hiding the whole Actions column.
  const isSupervisor = employeeRole === "SUPERVISOR"
  const isManagerRole = employeeRole === "MANAGER"

  const columnDefs = useMemo<ColDef<ReworkPendingScheduleRecord>[]>(
    () => [
      { field: "priorityNo",          headerName: "Priority No",          maxWidth: 100, sortable: false },
      { field: "priorityLevel",       headerName: "Priority Level",       cellRenderer: PriorityBadge, sortable: false, minWidth: 120 },
      { field: "reworkScheduleDate",  headerName: "Rework Schedule Date", minWidth: 160 },
      { field: "reworkScheduleId",    headerName: "Rework Schedule ID",   minWidth: 150 },
      {
        field: "reworkType", headerName: "Rework Type", minWidth: 150,
        valueFormatter: (p) => REWORK_TYPE_LABELS[p.value as ReworkType] ?? p.value,
      },
      { field: "companyName",         headerName: "Company",              cellStyle: { fontWeight: 600 }, minWidth: 110 },
      { field: "productName",         headerName: "Product",              cellStyle: { fontWeight: 600 }, minWidth: 100 },
      { field: "noOfOperations",      headerName: "No of Operations",     minWidth: 140 },
      { field: "targetQty",           headerName: "Target Qty",           minWidth: 100 },
      { field: "producedQty",         headerName: "Produced Qty",         minWidth: 120 },
      { field: "targetDate",          headerName: "Target Date",          cellRenderer: TargetDateCell, minWidth: 110 },
      {
        headerName: "Created By",
        valueGetter: (p: ValueGetterParams<ReworkPendingScheduleRecord>) =>
          p.data ? `${p.data.createdByEmpId} : ${p.data.createdByEmpName}` : "",
        minWidth: 150,
      },
      {
        headerName: "Staff Allocation",
        cellRenderer: ActionButtonCell,
        cellRendererParams: {
          onAction: (data: ReworkPendingScheduleRecord) => openAlloc(data.reworkPendingScheduleId),
          label: "Allocate",
          disabled: !canAllocate,
          getButtonClass: (data: ReworkPendingScheduleRecord) =>
            STAFF_ALLOCATION_BUTTON_STYLES[data.staffAllocationStatus as StaffAllocationStatus],
        },
        sortable: false, minWidth: 130,
      },
      ...(canManageSchedule
        ? [
            {
              headerName: "Actions",
              cellRenderer: EditDeleteCell,
              cellRendererParams: {
                onEdit: openEdit,
                onDelete: openDelete,
                isEditDisabled: (data: ReworkPendingScheduleRecord) =>
                  (isSupervisor && data.reworkType !== "InhouseRework") ||
                  (isManagerRole && data.reworkType === "InhouseRework"),
                isDeleteDisabled: (data: ReworkPendingScheduleRecord) =>
                  (isManagerRole && data.reworkType === "InhouseRework") ||
                  (isSupervisor && data.reworkType !== "InhouseRework"),
              },
              sortable: false,
              maxWidth: 90,
            } satisfies ColDef<ReworkPendingScheduleRecord>,
          ]
        : []),
    ],
    [openEdit, openDelete, openAlloc, canAllocate, canManageSchedule, isSupervisor, isManagerRole]
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
      <DataTable<ReworkPendingScheduleRecord>
        title="Rework Schedule"
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

      <ReworkScheduleFormDrawer
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
        title="Delete Rework Schedule"
        description="Are you sure you want to delete this rework schedule? This action cannot be undone."
      />

      <ReworkAllocationDialog
        key={allocationId ?? "none"}
        open={allocationId !== null}
        onClose={() => { setAllocationId(null); refetchSchedules() }}
        scheduleId={allocationId}
      />
    </>
  )
}
